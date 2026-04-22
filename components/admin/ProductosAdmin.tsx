"use client";

import { useState } from "react";
import { Producto, Categoria } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  AlertTriangle,
  Package,
  Download,
} from "lucide-react";

const CATEGORIAS: { valor: Categoria; etiqueta: string }[] = [
  { valor: "microfono", etiqueta: "Micrófono" },
  { valor: "adaptador", etiqueta: "Adaptador" },
  { valor: "cable", etiqueta: "Cable" },
  { valor: "audio", etiqueta: "Audio" },
  { valor: "accesorios", etiqueta: "Accesorios" },
  { valor: "otro", etiqueta: "Otro" },
];

const VACIO: Omit<Producto, "id" | "created_at"> = {
  nombre: "",
  descripcion: "",
  precio: 0,
  stock: 0,
  imagen_url: null,
  categoria: "microfono",
  activo: true,
};

export default function ProductosAdmin({
  productosIniciales,
}: {
  productosIniciales: Producto[];
}) {
  const [productos, setProductos] = useState<Producto[]>(productosIniciales);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);

  const abrirCrear = () => {
    setEditando(null);
    setForm(VACIO);
    setModalAbierto(true);
  };

  const abrirEditar = (p: Producto) => {
    setEditando(p);
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: p.precio,
      stock: p.stock,
      imagen_url: p.imagen_url,
      categoria: p.categoria,
      activo: p.activo,
    });
    setModalAbierto(true);
  };

  const cerrar = () => {
    setModalAbierto(false);
    setEditando(null);
  };

  const guardar = async () => {
    if (!form.nombre || form.precio <= 0) return;
    setGuardando(true);
    try {
      if (editando) {
        const { data, error } = await supabase
          .from("garshop_productos")
          .update(form)
          .eq("id", editando.id)
          .select()
          .single();
        if (error) throw error;
        setProductos((prev) =>
          prev.map((p) => (p.id === editando.id ? data : p))
        );
      } else {
        const { data, error } = await supabase
          .from("garshop_productos")
          .insert(form)
          .select()
          .single();
        if (error) throw error;
        setProductos((prev) => [data, ...prev]);
      }
      cerrar();
    } catch (err) {
      console.error(err);
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar este producto?")) return;
    setEliminandoId(id);
    try {
      await supabase.from("garshop_productos").delete().eq("id", id);
      setProductos((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setEliminandoId(null);
    }
  };

  const cargarCatalogo = async () => {
    const msg =
      productos.length > 0
        ? `Ya tienes ${productos.length} producto(s). ¿Agregar los del catálogo predefinido igualmente?`
        : "¿Cargar el catálogo inicial de electrónicos?";
    if (!confirm(msg)) return;

    setCargandoCatalogo(true);
    try {
      const password = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "garshop2024";
      const res = await fetch("/api/admin/seed", {
        method: "POST",
        headers: { "x-admin-password": password },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error desconocido");

      const { data } = await supabase
        .from("garshop_productos")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setProductos(data);
      alert(`Se agregaron ${json.cantidad} productos al catálogo.`);
    } catch (err) {
      alert("Error al cargar catálogo: " + (err as Error).message);
    } finally {
      setCargandoCatalogo(false);
    }
  };

  const toggleActivo = async (p: Producto) => {
    const { data } = await supabase
      .from("garshop_productos")
      .update({ activo: !p.activo })
      .eq("id", p.id)
      .select()
      .single();
    if (data) setProductos((prev) => prev.map((x) => (x.id === p.id ? data : x)));
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Productos</h1>
          <p className="text-sm text-gray-500">{productos.length} en total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={cargarCatalogo}
            disabled={cargandoCatalogo}
            className="flex items-center gap-2 rounded-xl border border-[#1e2a3a] bg-[#0d1520] px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-cyan-500/40 hover:text-white disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {cargandoCatalogo ? "Cargando..." : "Cargar catálogo"}
          </button>
          <button
            onClick={abrirCrear}
            className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-600"
          >
            <Plus className="h-4 w-4" />
            Agregar producto
          </button>
        </div>
      </div>

      {/* Tabla */}
      {productos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#1e2a3a] bg-[#0d1520] py-24 text-center">
          <Package className="mb-4 h-16 w-16 text-gray-700" />
          <p className="text-gray-400">No hay productos todavía</p>
          <button
            onClick={abrirCrear}
            className="mt-4 text-sm font-medium text-cyan-400 hover:underline"
          >
            Agregar el primero
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#1e2a3a] bg-[#0d1520]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e2a3a] text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2a3a]">
                {productos.map((p) => (
                  <tr key={p.id} className="transition hover:bg-[#111c2a]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{p.nombre}</p>
                      {p.descripcion && (
                        <p className="max-w-xs truncate text-xs text-gray-500">
                          {p.descripcion}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 capitalize">
                      {p.categoria}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-white">
                      RD${p.precio.toLocaleString("es-DO")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm font-medium ${
                          p.stock === 0
                            ? "text-red-400"
                            : p.stock <= 5
                            ? "text-yellow-400"
                            : "text-green-400"
                        }`}
                      >
                        {p.stock === 0 ? (
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Agotado
                          </span>
                        ) : (
                          p.stock
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActivo(p)}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                          p.activo
                            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            : "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                        }`}
                      >
                        {p.activo ? "Activo" : "Oculto"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => abrirEditar(p)}
                          className="rounded-lg p-1.5 text-gray-500 transition hover:bg-[#1e2a3a] hover:text-white"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => eliminar(p.id)}
                          disabled={eliminandoId === p.id}
                          className="rounded-lg p-1.5 text-gray-500 transition hover:bg-red-500/20 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalAbierto && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60"
            onClick={cerrar}
          />
          <div className="fixed inset-x-4 bottom-4 top-4 z-50 mx-auto flex max-w-md flex-col overflow-hidden rounded-2xl border border-[#1e2a3a] bg-[#0d1520] shadow-2xl sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[90vh] sm:-translate-x-1/2 sm:-translate-y-1/2">
            <div className="flex shrink-0 items-center justify-between border-b border-[#1e2a3a] px-6 py-4">
              <h2 className="text-lg font-bold text-white">
                {editando ? "Editar producto" : "Nuevo producto"}
              </h2>
              <button onClick={cerrar} className="text-gray-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">
                  Nombre *
                </label>
                <input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full rounded-lg border border-[#1e2a3a] bg-[#060c14] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                  placeholder="Micrófono USB Blue Yeti..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">
                    Precio (RD$) *
                  </label>
                  <input
                    type="number"
                    value={form.precio}
                    onChange={(e) =>
                      setForm({ ...form, precio: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-[#1e2a3a] bg-[#060c14] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                    min={0}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400">
                    Stock (unidades)
                  </label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) =>
                      setForm({ ...form, stock: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-[#1e2a3a] bg-[#060c14] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                    min={0}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">
                  Categoría
                </label>
                <select
                  value={form.categoria}
                  onChange={(e) =>
                    setForm({ ...form, categoria: e.target.value as Categoria })
                  }
                  className="w-full rounded-lg border border-[#1e2a3a] bg-[#060c14] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                >
                  {CATEGORIAS.map((c) => (
                    <option key={c.valor} value={c.valor}>
                      {c.etiqueta}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">
                  Descripción
                </label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) =>
                    setForm({ ...form, descripcion: e.target.value })
                  }
                  rows={3}
                  className="w-full resize-none rounded-lg border border-[#1e2a3a] bg-[#060c14] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                  placeholder="Compatibilidad, características, colores disponibles..."
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">
                  URL de imagen (opcional)
                </label>
                <input
                  value={form.imagen_url ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, imagen_url: e.target.value || null })
                  }
                  className="w-full rounded-lg border border-[#1e2a3a] bg-[#060c14] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                  className="h-4 w-4 accent-cyan-500"
                />
                <label htmlFor="activo" className="text-sm text-gray-300">
                  Visible en la tienda
                </label>
              </div>
            </div>

            </div>

            <div className="shrink-0 border-t border-[#1e2a3a] px-6 py-4">
            <div className="flex gap-3">
              <button
                onClick={cerrar}
                className="flex-1 rounded-xl border border-[#1e2a3a] py-2.5 text-sm font-medium text-gray-400 transition hover:bg-[#1a2535]"
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={guardando || !form.nombre || form.precio <= 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-500 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-600 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear producto"}
              </button>
            </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
