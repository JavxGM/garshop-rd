import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import nodemailer from "nodemailer";
import heicConvert from "heic-convert";

// Canvas de 1000×1000 fondo blanco, el PNG transparente va centrado y compuesto encima
const CANVAS_SIZE = 1000;
const JPEG_QUALITY = 85;
const REMOVEBG_API = "https://api.remove.bg/v1.0/removebg";
const ALERTA_UMBRAL = 40;

function crearSupabaseAdmin() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "placeholder-key";
  return createClient(url, key);
}

async function convertirHeicAJpeg(buffer: Buffer, mimeType: string, fileName: string): Promise<Buffer> {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const esHeic = mimeType === "image/heic" || mimeType === "image/heif" || ext === "heic" || ext === "heif";
  if (esHeic) {
    const resultado = await heicConvert({ buffer: new Uint8Array(buffer), format: "JPEG", quality: JPEG_QUALITY / 100 });
    return Buffer.from(resultado);
  }
  return buffer;
}

async function quitarFondo(archivoBuffer: Buffer): Promise<Buffer> {
  const apiKey = process.env.REMOVEBG_API_KEY;
  if (!apiKey) throw new Error("REMOVEBG_API_KEY no configurada");

  const formData = new FormData();
  // Convertir a Uint8Array para compatibilidad estricta con BlobPart
  const blob = new Blob([new Uint8Array(archivoBuffer)], { type: "image/jpeg" });
  formData.append("image_file", blob, "imagen.jpg");
  formData.append("size", "auto");

  const respuesta = await fetch(REMOVEBG_API, {
    method: "POST",
    headers: { "X-Api-Key": apiKey },
    body: formData,
  });

  if (!respuesta.ok) {
    const texto = await respuesta.text();
    throw new Error(`remove.bg respondió ${respuesta.status}: ${texto}`);
  }

  const arrayBuffer = await respuesta.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function procesarImagen(pngTransparente: Buffer): Promise<Buffer> {
  // Obtener dimensiones del PNG resultante para centrarlo en el canvas
  const meta = await sharp(pngTransparente).metadata();
  const anchoOriginal = meta.width ?? CANVAS_SIZE;
  const altoOriginal = meta.height ?? CANVAS_SIZE;

  // Calcular tamaño escalado manteniendo aspect ratio dentro del canvas con padding
  const padding = 80;
  const areaDisponible = CANVAS_SIZE - padding * 2;
  const escala = Math.min(
    areaDisponible / anchoOriginal,
    areaDisponible / altoOriginal,
    1 // nunca ampliar
  );
  const anchoFinal = Math.round(anchoOriginal * escala);
  const altoFinal = Math.round(altoOriginal * escala);
  const offsetX = Math.round((CANVAS_SIZE - anchoFinal) / 2);
  const offsetY = Math.round((CANVAS_SIZE - altoFinal) / 2);

  const imagenEscalada = await sharp(pngTransparente)
    .resize(anchoFinal, altoFinal, { fit: "fill" })
    .toBuffer();

  return sharp({
    create: {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([{ input: imagenEscalada, left: offsetX, top: offsetY }])
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();
}

async function subirAStorage(
  supabase: ReturnType<typeof crearSupabaseAdmin>,
  buffer: Buffer,
  productoId: string
): Promise<string> {
  const nombreArchivo = `${productoId}/${crypto.randomUUID()}.jpg`;

  const { error } = await supabase.storage
    .from("garshop-productos")
    .upload(nombreArchivo, buffer, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (error) throw new Error(`Error al subir a Storage: ${error.message}`);

  const { data } = supabase.storage
    .from("garshop-productos")
    .getPublicUrl(nombreArchivo);

  return data.publicUrl;
}

async function registrarImagenEnBD(
  supabase: ReturnType<typeof crearSupabaseAdmin>,
  productoId: string,
  url: string,
  orden: number,
  esPrimera: boolean
): Promise<void> {
  const { error } = await supabase
    .from("garshop_producto_imagenes")
    .insert({
      producto_id: productoId,
      url,
      orden,
      es_principal: esPrimera,
    });

  if (error) throw new Error(`Error al registrar imagen en BD: ${error.message}`);
}

async function contarImagenesExistentes(
  supabase: ReturnType<typeof crearSupabaseAdmin>,
  productoId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("garshop_producto_imagenes")
    .select("id", { count: "exact", head: true })
    .eq("producto_id", productoId);

  if (error) return 0;
  return count ?? 0;
}

async function incrementarContadorMensual(
  supabase: ReturnType<typeof crearSupabaseAdmin>
): Promise<number> {
  const mes = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

  // Upsert: si no existe la fila del mes, la crea; si existe, incrementa
  const { error: upsertError } = await supabase.rpc("garshop_incrementar_removebg_uso", {
    p_mes: mes,
  });

  if (upsertError) {
    // Fallback manual si el RPC no existe todavía
    const { data: fila } = await supabase
      .from("garshop_removebg_uso")
      .select("id, imagenes_procesadas")
      .eq("mes", mes)
      .maybeSingle();

    if (fila) {
      const nuevoTotal = fila.imagenes_procesadas + 1;
      await supabase
        .from("garshop_removebg_uso")
        .update({
          imagenes_procesadas: nuevoTotal,
          ultima_actualizacion: new Date().toISOString(),
        })
        .eq("id", fila.id);
      return nuevoTotal;
    } else {
      await supabase.from("garshop_removebg_uso").insert({
        mes,
        imagenes_procesadas: 1,
        ultima_actualizacion: new Date().toISOString(),
      });
      return 1;
    }
  }

  // Leer el total actual tras el upsert
  const { data: filaActual } = await supabase
    .from("garshop_removebg_uso")
    .select("imagenes_procesadas")
    .eq("mes", mes)
    .single();

  return filaActual?.imagenes_procesadas ?? 1;
}

async function enviarAlertaUsoPorEmail(
  supabase: ReturnType<typeof crearSupabaseAdmin>,
  totalProcesadas: number
): Promise<void> {
  const mes = new Date().toISOString().slice(0, 7);

  // Verificar si ya se envió la alerta este mes
  const { data: fila } = await supabase
    .from("garshop_removebg_uso")
    .select("alerta_enviada")
    .eq("mes", mes)
    .maybeSingle();

  if (!fila || fila.alerta_enviada) return;

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (!gmailUser || !gmailPass) {
    console.warn("[GarShop] GMAIL_USER/GMAIL_APP_PASSWORD no configuradas — alerta omitida");
    return;
  }

  const restantes = 50 - totalProcesadas;
  const mesFormateado = new Date(`${mes}-01`).toLocaleDateString("es-DO", {
    month: "long",
    year: "numeric",
  });

  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  try {
    await transport.sendMail({
      from: `"GarShop.rd" <${gmailUser}>`,
      to: "garciamartinezjavier1004@gmail.com",
      subject: `GarShop.rd — Alerta: ${totalProcesadas} imágenes procesadas este mes`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#0e7490;margin-bottom:8px">Alerta de uso — remove.bg</h2>
          <p style="color:#374151;margin-bottom:16px">
            Se han procesado <strong>${totalProcesadas} imágenes</strong> con remove.bg durante ${mesFormateado}.
          </p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
            <tr>
              <td style="padding:8px;border:1px solid #e5e7eb;color:#6b7280">Procesadas este mes</td>
              <td style="padding:8px;border:1px solid #e5e7eb;font-weight:600">${totalProcesadas} / 50</td>
            </tr>
            <tr>
              <td style="padding:8px;border:1px solid #e5e7eb;color:#6b7280">Restantes</td>
              <td style="padding:8px;border:1px solid #e5e7eb;font-weight:600;color:${restantes <= 5 ? "#dc2626" : "#059669"}">${restantes}</td>
            </tr>
          </table>
          <p style="color:#6b7280;font-size:14px">
            Si necesitas procesar más imágenes este mes, puedes subir fotos directamente desde el admin
            sin usar remove.bg o esperar al próximo mes para que el contador se reinicie.
          </p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0" />
          <p style="color:#9ca3af;font-size:12px">GarShop.rd — Panel Admin</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[GarShop] Error enviando alerta de email:", err);
    return;
  }

  // Marcar alerta como enviada
  await supabase
    .from("garshop_removebg_uso")
    .update({ alerta_enviada: true })
    .eq("mes", mes);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const password = req.headers.get("x-admin-password");
  const correcta = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "garshop2024";
  if (password !== correcta) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await req.formData();
  const productoId = formData.get("producto_id");
  if (!productoId || typeof productoId !== "string") {
    return NextResponse.json({ error: "producto_id requerido" }, { status: 400 });
  }

  const archivos = formData.getAll("file").filter((f) => f instanceof File) as File[];
  if (archivos.length === 0) {
    return NextResponse.json({ error: "Se requiere al menos un archivo" }, { status: 400 });
  }
  if (archivos.length > 10) {
    return NextResponse.json({ error: "Máximo 10 imágenes por lote" }, { status: 400 });
  }

  const supabase = crearSupabaseAdmin();
  const imagenesExistentes = await contarImagenesExistentes(supabase, productoId);
  const urlsProcesadas: string[] = [];
  const errores: { archivo: string; error: string }[] = [];

  for (let i = 0; i < archivos.length; i++) {
    const archivo = archivos[i];
    try {
      const rawBuffer = Buffer.from(await archivo.arrayBuffer());

      // 0. Convertir HEIC/HEIF a JPEG antes de cualquier procesamiento
      const inputBuffer = await convertirHeicAJpeg(rawBuffer, archivo.type, archivo.name);

      // 1. Quitar fondo con remove.bg
      const pngTransparente = await quitarFondo(inputBuffer);

      // 2. Procesar con sharp: canvas blanco 1000×1000 + JPEG 85
      const jpegFinal = await procesarImagen(pngTransparente);

      // 3. Subir a Supabase Storage
      const url = await subirAStorage(supabase, jpegFinal, productoId);

      // 4. Registrar en garshop_producto_imagenes
      const ordenActual = imagenesExistentes + i;
      const esPrimera = imagenesExistentes === 0 && i === 0;
      await registrarImagenEnBD(supabase, productoId, url, ordenActual, esPrimera);

      urlsProcesadas.push(url);

      // 5. Incrementar contador mensual de remove.bg
      const totalProcesadas = await incrementarContadorMensual(supabase);

      // 6. Enviar alerta si se alcanzó el umbral (una sola vez por mes)
      if (totalProcesadas >= ALERTA_UMBRAL) {
        void enviarAlertaUsoPorEmail(supabase, totalProcesadas);
      }
    } catch (err) {
      console.error(`[GarShop] Error procesando ${archivo.name}:`, err);
      errores.push({
        archivo: archivo.name,
        error: (err as Error).message,
      });
    }
  }

  if (urlsProcesadas.length === 0) {
    return NextResponse.json(
      { error: "No se pudo procesar ninguna imagen", errores },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    urls: urlsProcesadas,
    procesadas: urlsProcesadas.length,
    fallidas: errores.length,
    errores: errores.length > 0 ? errores : undefined,
  });
}
