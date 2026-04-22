"use client";

import { useState } from "react";
import { Pedido, EstadoPedido } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { ClipboardList, ChevronDown, ChevronUp, MessageCircle } from "lucide-react";

const ESTADOS: { valor: EstadoPedido; etiqueta: string; color: string }[] = [
  { valor: "pendiente", etiqueta: "Pendiente", color: "bg-yellow-500/20 text-yellow-400" },
  { valor: "confirmado", etiqueta: "Confirmado", color: "bg-blue-500/20 text-blue-400" },
  { valor: "entregado", etiqueta: "Entregado", color: "bg-green-500/20 text-green-400" },
  { valor: "cancelado", etiqueta: "Cancelado", color: "bg-red-500/20 text-red-400" },
];

function BadgeEstado({ estado }: { estado: EstadoPedido }) {
  const est = ESTADOS.find((e) => e.valor === estado);
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${est?.color}`}>
      {est?.etiqueta}
    </span>
  );
}

export default function PedidosAdmin({
  pedidosIniciales,
}: {
  pedidosIniciales: Pedido[];
}) {
  const [pedidos, setPedidos] = useState<Pedido[]>(pedidosIniciales);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<EstadoPedido | "todos">("todos");

  const pedidosFiltrados =
    filtro === "todos" ? pedidos : pedidos.filter((p) => p.estado === filtro);

  const cambiarEstado = async (id: string, estado: EstadoPedido) => {
    const { data } = await supabase
      .from("garshop_pedidos")
      .update({ estado })
      .eq("id", id)
      .select()
      .single();
    if (data) setPedidos((prev) => prev.map((p) => (p.id === id ? data : p)));
  };

  const whatsappCliente = (pedido: Pedido) => {
    const num = pedido.cliente_telefono.replace(/\D/g, "");
    return `https://wa.me/${num}`;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Pedidos</h1>
        <p className="text-sm text-gray-500">{pedidos.length} en total</p>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setFiltro("todos")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            filtro === "todos"
              ? "bg-cyan-500 text-white"
              : "bg-[#0d1520] text-gray-400 hover:bg-[#1a2535]"
          }`}
        >
          Todos ({pedidos.length})
        </button>
        {ESTADOS.map((e) => (
          <button
            key={e.valor}
            onClick={() => setFiltro(e.valor)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filtro === e.valor
                ? "bg-cyan-500 text-white"
                : "bg-[#0d1520] text-gray-400 hover:bg-[#1a2535]"
            }`}
          >
            {e.etiqueta} ({pedidos.filter((p) => p.estado === e.valor).length})
          </button>
        ))}
      </div>

      {/* Lista */}
      {pedidosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#1e2a3a] bg-[#0d1520] py-24 text-center">
          <ClipboardList className="mb-4 h-16 w-16 text-gray-700" />
          <p className="text-gray-400">No hay pedidos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pedidosFiltrados.map((pedido) => (
            <div
              key={pedido.id}
              className="overflow-hidden rounded-xl border border-[#1e2a3a] bg-[#0d1520]"
            >
              {/* Cabecera del pedido */}
              <div
                className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-[#111c2a]"
                onClick={() =>
                  setExpandido(expandido === pedido.id ? null : pedido.id)
                }
              >
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white">
                        {pedido.cliente_nombre}
                      </p>
                      <span className="rounded bg-[#1a2535] px-1.5 py-0.5 text-xs font-mono text-gray-500">
                        #{pedido.id.slice(0, 6).toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(pedido.created_at).toLocaleDateString("es-DO", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BadgeEstado estado={pedido.estado} />
                  <span className="font-bold text-white">
                    RD${pedido.total.toLocaleString("es-DO")}
                  </span>
                  {expandido === pedido.id ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              </div>

              {/* Detalle expandido */}
              {expandido === pedido.id && (
                <div className="border-t border-[#1e2a3a] px-4 py-4">
                  <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="mb-0.5 text-xs text-gray-500">Teléfono</p>
                      <p className="text-white">{pedido.cliente_telefono}</p>
                    </div>
                    <div>
                      <p className="mb-0.5 text-xs text-gray-500">Dirección</p>
                      <p className="text-white">{pedido.cliente_direccion}</p>
                    </div>
                    {pedido.notas && (
                      <div className="col-span-2">
                        <p className="mb-0.5 text-xs text-gray-500">Notas</p>
                        <p className="text-white">{pedido.notas}</p>
                      </div>
                    )}
                  </div>

                  {/* Productos */}
                  <div className="mb-4 space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Productos
                    </p>
                    {pedido.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-gray-300">
                          {item.cantidad}x {item.producto.nombre}
                        </span>
                        <span className="font-medium text-white">
                          RD$
                          {(item.producto.precio * item.cantidad).toLocaleString(
                            "es-DO"
                          )}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-[#1e2a3a] pt-2 text-sm font-bold">
                      <span className="text-white">Total</span>
                      <span className="text-cyan-400">
                        RD${pedido.total.toLocaleString("es-DO")}
                      </span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={whatsappCliente(pedido)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      WhatsApp
                    </a>
                    {ESTADOS.filter((e) => e.valor !== pedido.estado).map(
                      (e) => (
                        <button
                          key={e.valor}
                          onClick={() => cambiarEstado(pedido.id, e.valor)}
                          className="rounded-lg border border-[#1e2a3a] px-3 py-1.5 text-xs font-medium text-gray-400 transition hover:bg-[#1e2a3a] hover:text-white"
                        >
                          Marcar {e.etiqueta}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
