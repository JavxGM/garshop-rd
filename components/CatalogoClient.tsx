"use client";

import { useMemo, useState } from "react";
import { Producto, Categoria } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import { Search, X, Cpu } from "lucide-react";

const CATEGORIA_LABELS: Record<Categoria, string> = {
  microfono: "Micrófonos",
  adaptador: "Adaptadores",
  cable: "Cables",
  audio: "Audio",
  accesorios: "Accesorios",
  otro: "Otros",
};

const CATEGORIA_EMOJIS: Record<Categoria, string> = {
  microfono: "🎙️",
  adaptador: "🔌",
  cable: "🔋",
  audio: "🎧",
  accesorios: "🖥️",
  otro: "📦",
};

interface Props {
  productos: Producto[];
}

export default function CatalogoClient({ productos }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState<Categoria | "todos">("todos");

  // Categorías disponibles dinámicamente desde los productos cargados
  const categoriasDisponibles = useMemo<Categoria[]>(() => {
    const set = new Set<Categoria>();
    for (const p of productos) set.add(p.categoria);
    // Mantener orden canónico
    const orden: Categoria[] = ["microfono", "adaptador", "cable", "audio", "accesorios", "otro"];
    return orden.filter((c) => set.has(c));
  }, [productos]);

  // Filtrado combinado: búsqueda + categoría — sin petición a Supabase
  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return productos.filter((p) => {
      const matchCategoria =
        categoriaActiva === "todos" || p.categoria === categoriaActiva;
      const matchBusqueda =
        q === "" || p.nombre.toLowerCase().includes(q);
      return matchCategoria && matchBusqueda;
    });
  }, [productos, busqueda, categoriaActiva]);

  // Agrupación por categoría (solo para la vista sin filtro de categoría activo)
  const productosPorCategoria = useMemo(() => {
    if (categoriaActiva !== "todos") {
      // Si hay categoría activa, mostrar plana bajo esa categoría
      return [
        {
          categoria: categoriaActiva,
          productos: productosFiltrados,
        },
      ];
    }
    // Vista "Todos": agrupar y preservar orden
    const orden: Categoria[] = ["microfono", "adaptador", "cable", "audio", "accesorios", "otro"];
    return orden
      .map((cat) => ({
        categoria: cat,
        productos: productosFiltrados.filter((p) => p.categoria === cat),
      }))
      .filter((g) => g.productos.length > 0);
  }, [productosFiltrados, categoriaActiva]);

  const hayResultados = productosFiltrados.length > 0;
  const busquedaActiva = busqueda.trim() !== "";

  return (
    <section id="productos" className="mx-auto max-w-6xl px-4 pb-16">
      {/* Buscador */}
      <div className="mb-6 pt-8">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full rounded-xl border border-[#1e2a3a] bg-[#0d1520] py-3 pl-10 pr-10 text-sm text-white placeholder-gray-600 outline-none transition focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20"
            aria-label="Buscar productos"
          />
          {busquedaActiva && (
            <button
              onClick={() => setBusqueda("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-500 hover:text-white"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filtro de categorías */}
      {categoriasDisponibles.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setCategoriaActiva("todos")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              categoriaActiva === "todos"
                ? "bg-cyan-500 text-white"
                : "border border-[#1e2a3a] bg-[#0d1520] text-gray-400 hover:border-cyan-500/40 hover:text-white"
            }`}
          >
            Todos
          </button>
          {categoriasDisponibles.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaActiva(cat)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                categoriaActiva === cat
                  ? "bg-cyan-500 text-white"
                  : "border border-[#1e2a3a] bg-[#0d1520] text-gray-400 hover:border-cyan-500/40 hover:text-white"
              }`}
            >
              <span className="text-xs">{CATEGORIA_EMOJIS[cat]}</span>
              {CATEGORIA_LABELS[cat]}
            </button>
          ))}
        </div>
      )}

      {/* Resultados */}
      {!hayResultados ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Cpu className="mb-4 h-16 w-16 text-gray-700" />
          <h3 className="mb-2 text-lg font-semibold text-gray-400">
            No encontramos productos para tu búsqueda
          </h3>
          <p className="mb-6 text-sm text-gray-600">
            Intenta con otro término o revisa todas las categorías.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {busquedaActiva && (
              <button
                onClick={() => setBusqueda("")}
                className="rounded-xl border border-[#1e2a3a] bg-[#0d1520] px-5 py-2 text-sm font-medium text-gray-300 transition hover:border-cyan-500/40 hover:text-white"
              >
                Limpiar búsqueda
              </button>
            )}
            {categoriaActiva !== "todos" && (
              <button
                onClick={() => setCategoriaActiva("todos")}
                className="rounded-xl bg-cyan-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-cyan-600"
              >
                Ver todos los productos
              </button>
            )}
          </div>
        </div>
      ) : (
        productosPorCategoria.map((grupo, gi) => (
          <div key={grupo.categoria} id={`cat-${grupo.categoria}`} className="mb-12">
            {/* Encabezado de grupo solo en vista "Todos" */}
            {categoriaActiva === "todos" && (
              <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-white">
                <span>{CATEGORIA_EMOJIS[grupo.categoria]}</span>
                {CATEGORIA_LABELS[grupo.categoria]}
              </h2>
            )}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {grupo.productos.map((producto, i) => (
                <ProductCard
                  key={producto.id}
                  producto={producto}
                  priority={i < 4 && gi === 0}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
}
