"use client";

import { useCart } from "@/context/CartContext";
import { Producto } from "@/lib/types";
import { ShoppingCart, MessageCircle } from "lucide-react";

interface Props {
  producto: Producto;
}

export default function ProductDetailActions({ producto }: Props) {
  const { agregar, setAbierto } = useCart();

  const sinStock = producto.stock === 0;

  const handleAgregar = () => {
    agregar(producto);
  };

  const handleComprarAhora = () => {
    agregar(producto);
    setAbierto(true);
  };

  if (sinStock) {
    return (
      <div className="rounded-xl border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
        Este producto está agotado. Escríbenos por WhatsApp para consultar disponibilidad.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <button
        onClick={handleAgregar}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-cyan-500/50 bg-transparent px-6 py-3 font-semibold text-cyan-400 transition hover:bg-cyan-500/10 active:scale-95"
      >
        <ShoppingCart className="h-5 w-5" />
        Agregar al carrito
      </button>
      <button
        onClick={handleComprarAhora}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-white transition hover:bg-cyan-600 active:scale-95"
      >
        <MessageCircle className="h-5 w-5" />
        Comprar ahora
      </button>
    </div>
  );
}
