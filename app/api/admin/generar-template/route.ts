import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import path from "path";

// Dimensiones Instagram 4:5
const CANVAS_W = 1080;
const CANVAS_H = 1350;
const FONDO = { r: 10, g: 15, b: 26 }; // #0a0f1a
const JPEG_QUALITY = 95;

// Área de la foto: ~85% del alto, con padding lateral de 80px
const PADDING_LATERAL = 80;
const AREA_FOTO_H = Math.round(CANVAS_H * 0.85); // 1147px

// Degradado SVG de transparent→#0a0f1a sobre la parte baja de la zona de foto
function crearDegradadoSvg(): Buffer {
  const degradadoAlto = Math.round(AREA_FOTO_H * 0.35); // 35% inferior de la foto
  const degradadoTop = AREA_FOTO_H - degradadoAlto;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${CANVAS_H}">
    <defs>
      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0a0f1a" stop-opacity="0"/>
        <stop offset="100%" stop-color="#0a0f1a" stop-opacity="1"/>
      </linearGradient>
    </defs>
    <rect x="0" y="${degradadoTop}" width="${CANVAS_W}" height="${degradadoAlto + (CANVAS_H - AREA_FOTO_H)}" fill="url(#grad)"/>
  </svg>`;
  return Buffer.from(svg);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Autenticación
  const password = req.headers.get("x-admin-password");
  const correcta = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "garshop2024";
  if (password !== correcta) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // 2. Validar body
  let imagenUrl: string;
  try {
    const body = await req.json();
    if (!body?.imagenUrl || typeof body.imagenUrl !== "string") {
      return NextResponse.json({ error: "imagenUrl requerido" }, { status: 400 });
    }
    imagenUrl = body.imagenUrl;
    // Solo permitir URLs de Supabase storage para evitar SSRF
    const urlObj = new URL(imagenUrl);
    const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : null;
    if (supabaseHost && urlObj.hostname !== supabaseHost) {
      return NextResponse.json({ error: "URL no permitida" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  // 3. Fetch de la imagen del producto
  let fotoBuffer: Buffer;
  try {
    const res = await fetch(imagenUrl);
    if (!res.ok) {
      return NextResponse.json(
        { error: `No se pudo obtener la imagen: ${res.status}` },
        { status: 502 }
      );
    }
    fotoBuffer = Buffer.from(await res.arrayBuffer());
  } catch (err) {
    console.error("[GarShop] generar-template: error fetch imagen:", err);
    return NextResponse.json({ error: "Error al descargar la imagen" }, { status: 502 });
  }

  // 4. Composición con sharp
  try {
    const anchoFoto = CANVAS_W - PADDING_LATERAL * 2; // 920px

    // Redimensionar foto con contain dentro del área disponible, fondo navy
    const fotoResized = await sharp(fotoBuffer)
      .resize(anchoFoto, AREA_FOTO_H, {
        fit: "contain",
        background: FONDO,
      })
      .flatten({ background: FONDO })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();

    // Logo con fondo fusionado al navy (~120px de alto, proporcional)
    const logoPath = path.join(process.cwd(), "public", "logo-garshop.jpg");
    const logoResized = await sharp(logoPath)
      .resize({ height: 120, withoutEnlargement: false })
      .flatten({ background: FONDO })
      .toBuffer();
    const logoMeta = await sharp(logoResized).metadata();
    const logoW = logoMeta.width ?? 120;
    const logoH = logoMeta.height ?? 120;

    // Posición logo: esquina inferior derecha, margen 24px
    const logoLeft = CANVAS_W - logoW - 24;
    const logoTop = CANVAS_H - logoH - 24;

    // Degradado SVG
    const degradadoBuffer = crearDegradadoSvg();

    // Canvas base navy + foto centrada horizontalmente en la zona superior
    const resultado = await sharp({
      create: {
        width: CANVAS_W,
        height: CANVAS_H,
        channels: 3,
        background: FONDO,
      },
    })
      .composite([
        // Foto en la zona superior, centrada horizontalmente
        {
          input: fotoResized,
          left: PADDING_LATERAL,
          top: 0,
        },
        // Degradado sobre la transición inferior
        {
          input: degradadoBuffer,
          left: 0,
          top: 0,
        },
        // Logo esquina inferior derecha
        {
          input: logoResized,
          left: logoLeft,
          top: logoTop,
        },
      ])
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();

    return new NextResponse(new Uint8Array(resultado), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": 'attachment; filename="garshop-instagram.jpg"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[GarShop] generar-template: error composición:", err);
    return NextResponse.json(
      { error: "Error al generar el template" },
      { status: 500 }
    );
  }
}
