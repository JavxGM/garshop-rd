import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const JPEG_QUALITY = 85;

function crearSupabaseAdmin() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "placeholder-key";
  return createClient(url, key);
}

async function normalizarImagen(buffer: Buffer, mimeType: string): Promise<Buffer> {
  if (mimeType === "image/heic" || mimeType === "image/heif") {
    return sharp(buffer).jpeg({ quality: JPEG_QUALITY }).toBuffer();
  }
  return buffer;
}

function extensionParaMime(mimeType: string): string {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

function contentTypeParaMime(mimeType: string, esHeic: boolean): string {
  if (esHeic) return "image/jpeg";
  return mimeType;
}

async function subirAStorage(
  supabase: ReturnType<typeof crearSupabaseAdmin>,
  buffer: Buffer,
  productoId: string,
  mimeType: string,
  esHeic: boolean
): Promise<string> {
  const ext = esHeic ? "jpg" : extensionParaMime(mimeType);
  const nombreArchivo = `${productoId}/${crypto.randomUUID()}.${ext}`;
  const contentType = contentTypeParaMime(mimeType, esHeic);

  const { error } = await supabase.storage
    .from("garshop-productos")
    .upload(nombreArchivo, buffer, {
      contentType,
      upsert: false,
    });

  if (error) throw new Error(`Error al subir a Storage: ${error.message}`);

  const { data } = supabase.storage
    .from("garshop-productos")
    .getPublicUrl(nombreArchivo);

  return data.publicUrl;
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

export async function POST(req: NextRequest): Promise<NextResponse> {
  const password = req.headers.get("x-admin-password");
  const correcta = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "garshop2024";
  if (password !== correcta) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await req.formData();
  const productoId = formData.get("productoId");
  if (!productoId || typeof productoId !== "string") {
    return NextResponse.json({ error: "productoId requerido" }, { status: 400 });
  }

  const archivo = formData.get("archivo");
  if (!(archivo instanceof File)) {
    return NextResponse.json({ error: "archivo requerido" }, { status: 400 });
  }

  const tiposPermitidos = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
  if (!tiposPermitidos.includes(archivo.type)) {
    return NextResponse.json(
      { error: `Tipo no soportado: ${archivo.type}` },
      { status: 400 }
    );
  }

  const supabase = crearSupabaseAdmin();

  try {
    const rawBuffer = Buffer.from(await archivo.arrayBuffer());
    const esHeic = archivo.type === "image/heic" || archivo.type === "image/heif";

    const buffer = await normalizarImagen(rawBuffer, archivo.type);
    const url = await subirAStorage(supabase, buffer, productoId, archivo.type, esHeic);

    const imagenesExistentes = await contarImagenesExistentes(supabase, productoId);
    const esPrimera = imagenesExistentes === 0;

    const { data: imagenInsertada, error: insertError } = await supabase
      .from("garshop_producto_imagenes")
      .insert({
        producto_id: productoId,
        url,
        orden: imagenesExistentes,
        es_principal: esPrimera,
      })
      .select("id")
      .single();

    if (insertError) {
      throw new Error(`Error al registrar imagen en BD: ${insertError.message}`);
    }

    return NextResponse.json({ url, imagenId: imagenInsertada.id });
  } catch (err) {
    console.error("[GarShop] Error en subir-imagen:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
