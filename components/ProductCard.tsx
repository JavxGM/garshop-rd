"use client";

import { Producto } from "@/lib/types";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, ImageOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const CATEGORIA_LABELS: Record<string, string> = {
  microfono: "Micrófono",
  adaptador: "Adaptador",
  cable: "Cable",
  audio: "Audio",
  accesorios: "Accesorios",
  otro: "Otro",
};

interface Props {
  producto: Producto;
  priority?: boolean;
}

export default function ProductCard({ producto, priority = false }: Props) {
  const { agregar } = useCart();

  const sinStock = producto.stock === 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-[#1e2a3a] bg-[#0d1520] transition hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5">
      {/* Imagen — clickeable al detalle */}
      <Link href={`/productos/${producto.id}`} className="relative block aspect-square w-full overflow-hidden bg-[#111c2a]" tabIndex={-1} aria-hidden="true">
        {producto.imagen_url ? (
          <Image
            src={producto.imagen_url}
            alt={producto.nombre}
            fill
            priority={priority}
            className="object-cover transition group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageOff className="h-10 w-10 text-gray-700" />
          </div>
        )}
        {sinStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <span className="rounded-full bg-red-500/90 px-3 py-1 text-xs font-bold text-white">
              Agotado
            </span>
          </div>
        )}
        {producto.stock > 0 && producto.stock <= 5 && (
          <span className="absolute bottom-2 left-2 rounded-full bg-cyan-500/90 px-2 py-0.5 text-xs font-medium text-white">
            ¡Últimas {producto.stock}!
          </span>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3">
        <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-cyan-400/80">
          {CATEGORIA_LABELS[producto.categoria] ?? producto.categoria}
        </p>
        {/* Nombre clickeable al detalle */}
        <Link href={`/productos/${producto.id}`}>
          <h3 className="mb-1 text-sm font-semibold leading-tight text-white line-clamp-2 hover:text-cyan-300 transition-colors">
            {producto.nombre}
          </h3>
        </Link>
        {producto.descripcion && (
          <p className="mb-3 text-xs leading-relaxed text-gray-500 line-clamp-2">
            {producto.descripcion}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-base font-bold text-white">
            RD${producto.precio_venta.toLocaleString("es-DO")}
          </span>
          <button
            onClick={() => agregar(producto)}
            disabled={sinStock}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-cyan-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Añadir
          </button>
        </div>
      </div>
    </div>
  );
}
