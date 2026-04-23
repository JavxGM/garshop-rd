export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import { Producto } from "@/lib/types";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import ProductDetailActions from "@/components/ProductDetailActions";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ImageOff, Tag } from "lucide-react";

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
      .select("id, nombre, descripcion, precio_venta, stock, imagen_url, categoria, activo, created_at")
      .eq("id", id)
      .eq("activo", true)
      .single();

    if (error || !data) return null;
    return data as ProductoPublico;
  } catch {
    return null;
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
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
          {/* Imagen */}
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-[#1e2a3a] bg-[#0d1520]">
            {producto.imagen_url ? (
              <Image
                src={producto.imagen_url}
                alt={producto.nombre}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-700">
                <ImageOff className="h-20 w-20" />
                <p className="text-sm text-gray-600">Sin imagen disponible</p>
              </div>
            )}

            {/* Badges sobre imagen */}
            {sinStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <span className="rounded-full bg-red-500/90 px-4 py-2 text-sm font-bold text-white">
                  Agotado
                </span>
              </div>
            )}
            {!sinStock && producto.stock <= 5 && (
              <span className="absolute bottom-3 left-3 rounded-full bg-cyan-500/90 px-3 py-1 text-xs font-medium text-white">
                ¡Últimas {producto.stock} unidades!
              </span>
            )}
          </div>

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
            {producto.descripcion && (
              <p className="leading-relaxed text-gray-400">
                {producto.descripcion}
              </p>
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
