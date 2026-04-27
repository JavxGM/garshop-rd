export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import { Producto } from "@/lib/types";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import ProductDetailActions from "@/components/ProductDetailActions";
import ProductImageGallery from "@/components/ProductImageGallery";
import Link from "next/link";
import { ArrowLeft, Tag } from "lucide-react";

const CATEGORIA_LABELS: Record<string, string> = {
  microfono: "Micrófono",
  adaptador: "Adaptador",
  cable: "Cable",
  audio: "Audio",
  accesorios: "Accesorios",
  otro: "Otro",
};

// Solo campos públicos — precio_compra excluido explícitamente
type ProductoPublico = Omit<Producto, "precio_compra">;

async function getProducto(id: string): Promise<ProductoPublico | null> {
  try {
    const { data, error } = await supabase
      .from("garshop_productos")
      .select(`
        id, nombre, descripcion, precio_venta, stock, imagen_url, categoria, activo, created_at,
        garshop_producto_imagenes!producto_id(url, orden, es_principal)
      `)
      .eq("id", id)
      .eq("activo", true)
      .single();

    if (error || !data) return null;

    const imgs = (data.garshop_producto_imagenes ?? []) as {
      url: string;
      orden: number;
      es_principal: boolean;
    }[];
    const ordenadas = [...imgs].sort((a, b) => a.orden - b.orden);
    const principal = ordenadas.find((i) => i.es_principal)?.url ?? ordenadas[0]?.url ?? null;

    return {
      ...data,
      imagen_principal: principal,
      imagenes: ordenadas.map((i) => i.url),
    } as ProductoPublico;
  } catch {
    return null;
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const producto = await getProducto(id);

  if (!producto) {
    return {
      title: "Producto no encontrado — GarShop.rd",
    };
  }

  const imagen =
    producto.imagen_principal ?? producto.imagen_url ?? "/og-image.jpg";

  const titulo = `${producto.nombre} — GarShop.rd`;
  const descripcion =
    producto.descripcion ??
    `Compra ${producto.nombre} en GarShop.rd. Precio: RD$${producto.precio_venta.toLocaleString("es-DO")}. Pedidos por WhatsApp.`;

  return {
    title: titulo,
    description: descripcion,
    openGraph: {
      title: titulo,
      description: descripcion,
      type: "website",
      locale: "es_DO",
      siteName: "GarShop.rd",
      images: [
        {
          url: imagen,
          width: 1200,
          height: 630,
          alt: producto.nombre,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: descripcion,
      images: [imagen],
    },
  };
}

// ─── Descripción con formato ──────────────────────────────────────────────────
// Respeta saltos de línea y detecta líneas que empiezan con "-" o "•" para
// renderizarlas como lista. No usa dangerouslySetInnerHTML — todo es JSX puro.

function ProductDescription({ texto }: { texto: string }) {
  const lineas = texto.split(/\r?\n/);

  // Agrupa líneas en bloques: listas (líneas con "-"/"•") y párrafos normales
  type Bloque =
    | { tipo: "parrafo"; lineas: string[] }
    | { tipo: "lista"; items: string[] };

  const bloques: Bloque[] = [];
  let parrafoActual: string[] = [];
  let listaActual: string[] = [];

  const flushParrafo = () => {
    if (parrafoActual.length > 0) {
      bloques.push({ tipo: "parrafo", lineas: [...parrafoActual] });
      parrafoActual = [];
    }
  };
  const flushLista = () => {
    if (listaActual.length > 0) {
      bloques.push({ tipo: "lista", items: [...listaActual] });
      listaActual = [];
    }
  };

  for (const linea of lineas) {
    const esItemLista = /^[\-•]\s+/.test(linea.trim());
    if (esItemLista) {
      flushParrafo();
      listaActual.push(linea.trim().replace(/^[\-•]\s+/, ""));
    } else if (linea.trim() === "") {
      // Línea vacía separa bloques
      flushParrafo();
      flushLista();
    } else {
      flushLista();
      parrafoActual.push(linea);
    }
  }
  flushParrafo();
  flushLista();

  if (bloques.length === 0) return null;

  return (
    <div className="space-y-3 text-[0.9375rem] leading-relaxed text-gray-400">
      {bloques.map((bloque, i) => {
        if (bloque.tipo === "lista") {
          return (
            <ul key={i} className="space-y-1.5 pl-1">
              {bloque.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2">
                  <span className="mt-[0.4em] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500/70" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        // párrafo: múltiples líneas separadas por <br>
        return (
          <p key={i}>
            {bloque.lineas.map((linea, j) => (
              <span key={j}>
                {linea}
                {j < bloque.lineas.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export default async function ProductoDetallePage({ params }: PageProps) {
  const { id } = await params;
  const producto = await getProducto(id);

  if (!producto) {
    notFound();
  }

  // Cast seguro: precio_compra no fue cargado desde Supabase
  const productoParaCart = { ...producto, precio_compra: null } satisfies Producto;

  const sinStock = producto.stock === 0;
  const stockBajo = !sinStock && producto.stock <= 5 ? producto.stock : null;

  // Construye el array de imágenes que va a la galería:
  // usa imagenes[] si existe y tiene al menos una entrada, si no cae al imagen_url legacy
  const imagenesGaleria: string[] =
    producto.imagenes && producto.imagenes.length > 0
      ? producto.imagenes
      : producto.imagen_url
      ? [producto.imagen_url]
      : [];

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <Navbar />
      <CartDrawer />

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Volver */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-cyan-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la tienda
        </Link>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Galería */}
          <ProductImageGallery
            imagenes={imagenesGaleria}
            nombre={producto.nombre}
            sinStock={sinStock}
            stockBajo={stockBajo}
          />

          {/* Info */}
          <div className="flex flex-col gap-5">
            {/* Categoría */}
            <div className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-cyan-400/70" />
              <span className="text-xs font-medium uppercase tracking-widest text-cyan-400/80">
                {CATEGORIA_LABELS[producto.categoria] ?? producto.categoria}
              </span>
            </div>

            {/* Nombre */}
            <h1 className="text-2xl font-extrabold leading-tight text-white md:text-3xl">
              {producto.nombre}
            </h1>

            {/* Precio */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">
                RD${producto.precio_venta.toLocaleString("es-DO")}
              </span>
            </div>

            {/* Descripción */}
            {producto.descripcion && producto.descripcion.trim() && (
              <ProductDescription texto={producto.descripcion} />
            )}

            {/* Stock info */}
            {!sinStock && (
              <p className="text-sm text-gray-600">
                {producto.stock > 5
                  ? "En stock"
                  : `Solo quedan ${producto.stock} unidades`}
              </p>
            )}

            {/* Acciones */}
            <ProductDetailActions producto={productoParaCart} />

            {/* Trust badges */}
            <div className="mt-2 flex flex-col gap-2 rounded-xl border border-[#1e2a3a] bg-[#0d1520] p-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-widest text-gray-500">
                Garantías
              </p>
              <ul className="space-y-1.5 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                  Entrega a domicilio en todo el país
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                  Pago contra entrega o transferencia
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                  Atención por WhatsApp
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer mínimo */}
      <footer className="border-t border-[#1e2a3a] bg-[#0a0f1a] px-4 py-6 text-center">
        <p className="text-sm text-gray-600">
          © {new Date().getFullYear()} GarShop.rd — República Dominicana
        </p>
      </footer>
    </div>
  );
}
