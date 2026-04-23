"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { ItemCarrito, Producto } from "@/lib/types";

interface CartContextType {
  items: ItemCarrito[];
  agregar: (producto: Producto) => void;
  quitar: (productoId: string) => void;
  cambiarCantidad: (productoId: string, cantidad: number) => void;
  limpiar: () => void;
  total: number;
  cantidad: number;
  abierto: boolean;
  setAbierto: (v: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [abierto, setAbierto] = useState(false);

  const agregar = (producto: Producto) => {
    setItems((prev) => {
      const existente = prev.find((i) => i.producto.id === producto.id);
      if (existente) {
        return prev.map((i) =>
          i.producto.id === producto.id
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        );
      }
      return [...prev, { producto, cantidad: 1 }];
    });
    setAbierto(true);
  };

  const quitar = (productoId: string) => {
    setItems((prev) => prev.filter((i) => i.producto.id !== productoId));
  };

  const cambiarCantidad = (productoId: string, cantidad: number) => {
    if (cantidad < 1) {
      quitar(productoId);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.producto.id === productoId ? { ...i, cantidad } : i
      )
    );
  };

  const limpiar = () => setItems([]);

  const total = items.reduce(
    (acc, i) => acc + i.producto.precio_venta * i.cantidad,
    0
  );

  const cantidad = items.reduce((acc, i) => acc + i.cantidad, 0);

  return (
    <CartContext.Provider
      value={{ items, agregar, quitar, cambiarCantidad, limpiar, total, cantidad, abierto, setAbierto }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
