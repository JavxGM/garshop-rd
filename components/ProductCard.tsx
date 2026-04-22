"use client";

import { Producto } from "@/lib/types";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, ImageOff } from "lucide-react";
import Image from "next/image";

interface Props {
  producto: Producto;
}

export default function ProductCard({ producto }: Props) {
  const { agregar } = useCart();

  const sinStock = producto.stock === 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-[#1e2a3a] bg-[#0d1520] transition hover:border-cyan-500/40">
      {/* Imagen */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#111c2a]">
        {producto.imagen_url ? (
          <Image
            src={producto.imagen_url}
            alt={producto.nombre}
            fill
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
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3">
        <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-cyan-400/80">
          {producto.categoria}
        </p>
        <h3 className="mb-1 text-sm font-semibold leading-tight text-white line-clamp-2">
          {producto.nombre}
        </h3>
        {producto.descripcion && (
          <p className="mb-3 text-xs leading-relaxed text-gray-500 line-clamp-2">
            {producto.descripcion}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-base font-bold text-white">
            RD${producto.precio.toLocaleString("es-DO")}
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
