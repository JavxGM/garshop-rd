"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { generarMensajeWhatsApp } from "@/lib/whatsapp";
import { supabase } from "@/lib/supabase";
import { X, Trash2, Plus, Minus, ShoppingCart, MessageCircle } from "lucide-react";

export default function CartDrawer() {
  const { items, abierto, setAbierto, quitar, cambiarCantidad, total, limpiar } =
    useCart();

  const [paso, setPaso] = useState<"carrito" | "datos">("carrito");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handlePedido = async () => {
    if (!nombre || !telefono || !direccion || enviando) return;
    setEnviando(true);
    try {
      await supabase.from("garshop_pedidos").insert({
        cliente_nombre: nombre,
        cliente_telefono: telefono,
        cliente_direccion: direccion,
        items,
        total,
        estado: "pendiente",
        notas: notas || null,
      });
    } catch (err) {
      console.error("Error guardando pedido:", err);
    } finally {
      const url = generarMensajeWhatsApp(items, nombre, telefono, direccion, notas);
      window.open(url, "_blank");
      limpiar();
      setPaso("carrito");
      setNombre("");
      setTelefono("");
      setDireccion("");
      setNotas("");
      setAbierto(false);
      setEnviando(false);
    }
  };

  if (!abierto) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={() => { setAbierto(false); setPaso("carrito"); }}
      />

      {/* Drawer */}
      <div className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col border-l border-[#1e2a3a] bg-[#0a0f1a] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e2a3a] px-5 py-4">
          <div className="flex items-center gap-2">
            {paso === "datos" && (
              <button
                onClick={() => setPaso("carrito")}
                className="mr-1 rounded-lg p-1 text-gray-400 hover:text-white"
              >
                ←
              </button>
            )}
            <ShoppingCart className="h-5 w-5 text-cyan-400" />
            <h2 className="font-bold text-white">
              {paso === "carrito" ? "Mi Carrito" : "Completar pedido"}
            </h2>
          </div>
          <button
            onClick={() => { setAbierto(false); setPaso("carrito"); }}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-[#1a2535] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {paso === "carrito" ? (
            <>
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <ShoppingCart className="mb-4 h-16 w-16 text-gray-700" />
                  <p className="text-gray-500">Tu carrito está vacío</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.producto.id}
                      className="flex gap-3 rounded-xl border border-[#1e2a3a] bg-[#0d1520] p-3"
                    >
                      <div className="flex flex-1 flex-col gap-1">
                        <p className="text-sm font-semibold text-white leading-tight">
                          {item.producto.nombre}
                        </p>
                        <p className="text-xs text-cyan-400">
                          RD${item.producto.precio.toLocaleString("es-DO")} c/u
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <button
                            onClick={() =>
                              cambiarCantidad(item.producto.id, item.cantidad - 1)
                            }
                            className="rounded-md bg-[#1a2535] p-1 text-gray-400 hover:text-white"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-bold text-white">
                            {item.cantidad}
                          </span>
                          <button
                            onClick={() =>
                              cambiarCantidad(item.producto.id, item.cantidad + 1)
                            }
                            disabled={item.cantidad >= item.producto.stock}
                            className="rounded-md bg-[#1a2535] p-1 text-gray-400 hover:text-white disabled:opacity-40"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <button
                          onClick={() => quitar(item.producto.id)}
                          className="text-gray-600 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <p className="text-sm font-bold text-white">
                          RD$
                          {(item.producto.precio * item.cantidad).toLocaleString("es-DO")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                Completa tus datos para enviar el pedido por WhatsApp.
              </p>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">
                  Nombre completo *
                </label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Juan Pérez"
                  className="w-full rounded-lg border border-[#1e2a3a] bg-[#0d1520] px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">
                  Teléfono (WhatsApp) *
                </label>
                <input
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="809-555-0000"
                  className="w-full rounded-lg border border-[#1e2a3a] bg-[#0d1520] px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">
                  Dirección de entrega *
                </label>
                <input
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Calle, sector, ciudad"
                  className="w-full rounded-lg border border-[#1e2a3a] bg-[#0d1520] px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">
                  Notas (opcional)
                </label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Horario preferido, instrucciones especiales..."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-[#1e2a3a] bg-[#0d1520] px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-cyan-500"
                />
              </div>

              {/* Resumen */}
              <div className="rounded-xl border border-[#1e2a3a] bg-[#0d1520] p-4">
                <p className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Resumen
                </p>
                {items.map((item) => (
                  <div key={item.producto.id} className="flex justify-between py-1">
                    <span className="text-xs text-gray-400">
                      {item.cantidad}x {item.producto.nombre}
                    </span>
                    <span className="text-xs font-medium text-white">
                      RD${(item.producto.precio * item.cantidad).toLocaleString("es-DO")}
                    </span>
                  </div>
                ))}
                <div className="mt-2 flex justify-between border-t border-[#1e2a3a] pt-2">
                  <span className="text-sm font-bold text-white">Total</span>
                  <span className="text-sm font-bold text-cyan-400">
                    RD${total.toLocaleString("es-DO")}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[#1e2a3a] px-5 py-4">
            {paso === "carrito" ? (
              <>
                <div className="mb-3 flex justify-between text-sm">
                  <span className="text-gray-400">Total</span>
                  <span className="font-bold text-white">
                    RD${total.toLocaleString("es-DO")}
                  </span>
                </div>
                <button
                  onClick={() => setPaso("datos")}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3 font-semibold text-white transition hover:bg-cyan-600 active:scale-95"
                >
                  Continuar pedido
                </button>
              </>
            ) : (
              <button
                onClick={handlePedido}
                disabled={!nombre || !telefono || !direccion || enviando}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <MessageCircle className="h-5 w-5" />
                {enviando ? "Enviando..." : "Enviar pedido por WhatsApp"}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
