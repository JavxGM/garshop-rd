"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Camera,
  Users,
  Store,
  BarChart3,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  PlanPublicacion,
  SemanaReview,
  DiaPlan,
  TipoContenido,
  CanalesPlan,
  Producto,
} from "@/lib/types";

// ─── Helpers de fecha ─────────────────────────────────────────────────────────

function getLunesDeEstaSemana(): string {
  const hoy = new Date();
  const dia = hoy.getDay(); // 0=dom, 1=lun, …
  const diff = dia === 0 ? -6 : 1 - dia; // retroceder al lunes
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + diff);
  return lunes.toISOString().slice(0, 10);
}

function getLunesProximaSemana(semanaActual: string): string {
  const d = new Date(semanaActual + "T12:00:00");
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

function formatFechaSemana(semanaInicio: string): string {
  const lunes = new Date(semanaInicio + "T12:00:00");
  const domingo = new Date(semanaInicio + "T12:00:00");
  domingo.setDate(lunes.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${lunes.toLocaleDateString("es-DO", opts)} – ${domingo.toLocaleDateString("es-DO", opts)}`;
}

function fechaDia(semanaInicio: string, dia: DiaPlan): string {
  const offsets: Record<DiaPlan, number> = {
    lunes: 0,
    miercoles: 2,
    viernes: 4,
  };
  const d = new Date(semanaInicio + "T12:00:00");
  d.setDate(d.getDate() + offsets[dia]);
  return d.toLocaleDateString("es-DO", { day: "numeric", month: "short" });
}

// ─── Generación de captions ───────────────────────────────────────────────────

function generarCaption(
  tipo: TipoContenido,
  producto: Producto | null,
  whatsapp: string
): string {
  const nombre = producto?.nombre ?? "[nombre del producto]";
  const precio = producto
    ? `RD$${producto.precio_venta.toLocaleString("es-DO")}`
    : "RD$[PRECIO]";
  const id = producto?.id ?? "[ID]";
  const wa = whatsapp || "[número WhatsApp]";

  if (tipo === "producto_directo") {
    return `🔌 ${nombre}
Precio: ${precio}
✅ En stock
📦 Envíos a todo el país

👉 Ver más: garshop.rd/productos/${id}
📲 Escríbenos por WhatsApp para coordinar tu pedido`;
  }

  if (tipo === "problema_solucion") {
    return `¿Tienes problemas con [describe el problema relacionado]?

${nombre} es la solución 💡

✅ Fácil de usar
✅ Compatible con la mayoría de dispositivos
✅ Envíos a todo el país

📲 Escríbenos: ${wa}`;
  }

  // cta_directo
  return `⚡ ¡Quedan pocas unidades de ${nombre}!

Precio: ${precio}
📦 Envíos rápidos a todo el país

No te quedes sin el tuyo 👇
📲 WhatsApp: ${wa}
🛒 garshop.rd/productos/${id}`;
}

// ─── Configuración de los días ────────────────────────────────────────────────

const DIAS_CONFIG: {
  dia: DiaPlan;
  label: string;
  tipoDefault: TipoContenido;
  tipoLabel: string;
  color: string;
  colorBg: string;
}[] = [
  {
    dia: "lunes",
    label: "Lunes",
    tipoDefault: "producto_directo",
    tipoLabel: "Producto directo",
    color: "text-cyan-400",
    colorBg: "bg-cyan-500/10 border-cyan-500/20",
  },
  {
    dia: "miercoles",
    label: "Miércoles",
    tipoDefault: "problema_solucion",
    tipoLabel: "Problema-Solución",
    color: "text-violet-400",
    colorBg: "bg-violet-500/10 border-violet-500/20",
  },
  {
    dia: "viernes",
    label: "Viernes",
    tipoDefault: "cta_directo",
    tipoLabel: "CTA directo",
    color: "text-orange-400",
    colorBg: "bg-orange-500/10 border-orange-500/20",
  },
];

const TIPOS_CONTENIDO: { valor: TipoContenido; label: string }[] = [
  { valor: "producto_directo", label: "Producto directo" },
  { valor: "problema_solucion", label: "Problema-Solución" },
  { valor: "cta_directo", label: "CTA directo" },
];

// ─── Subcomponente: slot de un día ────────────────────────────────────────────

interface SlotProps {
  plan: PlanPublicacion | null;
  dia: DiaPlan;
  semanaInicio: string;
  productos: Producto[];
  whatsapp: string;
  onSave: (updated: PlanPublicacion) => void;
  onMarcarPublicado: (id: string) => void;
}

function SlotDia({
  plan,
  dia,
  semanaInicio,
  productos,
  whatsapp,
  onSave,
  onMarcarPublicado,
}: SlotProps) {
  const config = DIAS_CONFIG.find((d) => d.dia === dia)!;

  const [expandido, setExpandido] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [marcando, setMarcando] = useState(false);

  const productoActual = plan?.producto_id
    ? (productos.find((p) => p.id === plan.producto_id) ?? null)
    : null;

  // Estado editable local
  const [productoId, setProductoId] = useState<string>(
    plan?.producto_id ?? ""
  );
  const [tipo, setTipo] = useState<TipoContenido>(
    plan?.tipo_contenido ?? config.tipoDefault
  );
  const [caption, setCaption] = useState<string>(plan?.caption ?? "");
  const [canales, setCanales] = useState<CanalesPlan>(
    plan?.canales ?? { instagram: true, facebook: true, marketplace: "" }
  );
  const [mensajes, setMensajes] = useState<number>(
    plan?.mensajes_recibidos ?? 0
  );

  // Cuando cambia el producto o el tipo, regenerar caption si está vacío
  const productoSeleccionado = productos.find((p) => p.id === productoId) ?? null;

  const regenerarCaption = () => {
    setCaption(generarCaption(tipo, productoSeleccionado, whatsapp));
  };

  // Generar caption al cambiar tipo o producto (solo si el usuario no ha editado)
  const handleTipoChange = (nuevoTipo: TipoContenido) => {
    setTipo(nuevoTipo);
    setCaption(generarCaption(nuevoTipo, productoSeleccionado, whatsapp));
  };

  const handleProductoChange = (pid: string) => {
    setProductoId(pid);
    const prod = productos.find((p) => p.id === pid) ?? null;
    setCaption(generarCaption(tipo, prod, whatsapp));
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const payload = {
        semana_inicio: semanaInicio,
        dia,
        producto_id: productoId || null,
        tipo_contenido: tipo,
        caption,
        canales,
        mensajes_recibidos: mensajes,
      };

      let resultado: PlanPublicacion | null = null;

      if (plan?.id) {
        const { data } = await supabase
          .from("garshop_plan_publicacion")
          .update(payload)
          .eq("id", plan.id)
          .select()
          .single();
        resultado = data as PlanPublicacion | null;
      } else {
        const { data } = await supabase
          .from("garshop_plan_publicacion")
          .insert({ ...payload, publicado: false })
          .select()
          .single();
        resultado = data as PlanPublicacion | null;
      }

      if (resultado) {
        onSave(resultado);
        setExpandido(false);
      }
    } finally {
      setGuardando(false);
    }
  };

  const handleMarcarPublicado = async () => {
    if (!plan?.id) return;
    setMarcando(true);
    try {
      const { data } = await supabase
        .from("garshop_plan_publicacion")
        .update({ publicado: true, mensajes_recibidos: mensajes })
        .eq("id", plan.id)
        .select()
        .single();
      if (data) onMarcarPublicado(plan.id);
    } finally {
      setMarcando(false);
    }
  };

  const estaPublicado = plan?.publicado === true;

  return (
    <div
      className={`overflow-hidden rounded-xl border ${
        estaPublicado
          ? "border-green-500/20 bg-green-500/5"
          : `border ${config.colorBg}`
      }`}
    >
      {/* Cabecera */}
      <div
        className="flex cursor-pointer items-center justify-between px-4 py-3"
        onClick={() => setExpandido(!expandido)}
      >
        <div className="flex items-center gap-3">
          {estaPublicado ? (
            <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
          ) : (
            <Circle className={`h-5 w-5 shrink-0 ${config.color}`} />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${estaPublicado ? "text-green-300" : config.color}`}>
                {config.label}
              </span>
              <span className="text-xs text-gray-500">
                {fechaDia(semanaInicio, dia)}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {plan?.tipo_contenido
                ? TIPOS_CONTENIDO.find((t) => t.valor === plan.tipo_contenido)?.label
                : config.tipoLabel}
              {productoActual && (
                <span className="ml-2 text-gray-400">· {productoActual.nombre}</span>
              )}
              {estaPublicado && plan?.mensajes_recibidos != null && (
                <span className="ml-2 font-medium text-green-400">
                  · {plan.mensajes_recibidos} mensajes
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {estaPublicado && (
            <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
              Publicado
            </span>
          )}
          {expandido ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </div>
      </div>

      {/* Cuerpo expandido */}
      {expandido && (
        <div className="border-t border-[#1e2a3a] px-4 py-4 space-y-4">
          {/* Fila: producto + tipo */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">
                Producto
              </label>
              <select
                value={productoId}
                onChange={(e) => handleProductoChange(e.target.value)}
                className="w-full rounded-lg border border-[#1e2a3a] bg-[#0d1520] px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="">— Sin producto —</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} — RD${p.precio_venta.toLocaleString("es-DO")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">
                Tipo de contenido
              </label>
              <select
                value={tipo}
                onChange={(e) => handleTipoChange(e.target.value as TipoContenido)}
                className="w-full rounded-lg border border-[#1e2a3a] bg-[#0d1520] px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
              >
                {TIPOS_CONTENIDO.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Caption */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-medium text-gray-400">
                Caption sugerido
              </label>
              <button
                type="button"
                onClick={regenerarCaption}
                className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
              >
                <RefreshCw className="h-3 w-3" />
                Regenerar
              </button>
            </div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={8}
              className="w-full rounded-lg border border-[#1e2a3a] bg-[#0d1520] px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none font-mono leading-relaxed resize-y"
              placeholder="Escribe o genera un caption..."
            />
          </div>

          {/* Canales */}
          <div>
            <p className="mb-2 text-xs font-medium text-gray-400">Canales</p>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={canales.instagram}
                  onChange={(e) =>
                    setCanales((c) => ({ ...c, instagram: e.target.checked }))
                  }
                  className="h-4 w-4 accent-cyan-500"
                />
                <Camera className="h-4 w-4 text-pink-400" />
                Instagram
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={canales.facebook}
                  onChange={(e) =>
                    setCanales((c) => ({ ...c, facebook: e.target.checked }))
                  }
                  className="h-4 w-4 accent-cyan-500"
                />
                <Users className="h-4 w-4 text-blue-400" />
                Facebook
              </label>
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-gray-500 shrink-0" />
                <input
                  type="text"
                  value={canales.marketplace}
                  onChange={(e) =>
                    setCanales((c) => ({ ...c, marketplace: e.target.value }))
                  }
                  placeholder="Marketplace (notas opcionales)"
                  className="rounded-lg border border-[#1e2a3a] bg-[#0d1520] px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:border-cyan-500 focus:outline-none w-56"
                />
              </div>
            </div>
          </div>

          {/* Mensajes recibidos (post-publicación) */}
          <div className="flex items-center gap-3">
            <MessageCircle className="h-4 w-4 text-green-400 shrink-0" />
            <label className="text-sm text-gray-400 shrink-0">
              Mensajes recibidos:
            </label>
            <input
              type="number"
              min={0}
              value={mensajes}
              onChange={(e) => setMensajes(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-20 rounded-lg border border-[#1e2a3a] bg-[#0d1520] px-3 py-1.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:opacity-60"
            >
              {guardando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Guardar
            </button>
            {plan?.id && !estaPublicado && (
              <button
                onClick={handleMarcarPublicado}
                disabled={marcando}
                className="flex items-center gap-1.5 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-800 disabled:opacity-60"
              >
                {marcando ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Marcar como publicado
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Subcomponente: review del domingo ───────────────────────────────────────

interface ReviewProps {
  review: SemanaReview | null;
  semanaInicio: string;
  planes: PlanPublicacion[];
  onSave: (r: SemanaReview) => void;
  onCerrarSemana: () => void;
}

function ReviewDomingo({
  review,
  semanaInicio,
  planes,
  onSave,
  onCerrarSemana,
}: ReviewProps) {
  const [ventas, setVentas] = useState<number>(review?.ventas_cerradas ?? 0);
  const [notas, setNotas] = useState<string>(review?.notas ?? "");
  const [guardando, setGuardando] = useState(false);
  const [cerrando, setCerrando] = useState(false);

  const publicados = planes.filter((p) => p.publicado).length;
  const totalMensajes = planes.reduce((s, p) => s + (p.mensajes_recibidos ?? 0), 0);

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      let resultado: SemanaReview | null = null;
      const payload = { semana_inicio: semanaInicio, ventas_cerradas: ventas, notas };

      if (review?.id) {
        const { data } = await supabase
          .from("garshop_semana_review")
          .update(payload)
          .eq("id", review.id)
          .select()
          .single();
        resultado = data as SemanaReview | null;
      } else {
        const { data } = await supabase
          .from("garshop_semana_review")
          .insert({ ...payload, cerrada: false })
          .select()
          .single();
        resultado = data as SemanaReview | null;
      }
      if (resultado) onSave(resultado);
    } finally {
      setGuardando(false);
    }
  };

  const handleCerrar = async () => {
    if (!review?.id) {
      alert("Guarda el review primero antes de cerrar la semana.");
      return;
    }
    setCerrando(true);
    try {
      await supabase
        .from("garshop_semana_review")
        .update({ cerrada: true })
        .eq("id", review.id);
      onCerrarSemana();
    } finally {
      setCerrando(false);
    }
  };

  return (
    <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 overflow-hidden">
      {/* Cabecera */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e2a3a]">
        <BarChart3 className="h-5 w-5 text-yellow-400" />
        <div>
          <span className="font-semibold text-yellow-400">Domingo — Review de la semana</span>
          <p className="text-xs text-gray-500">Anota resultados y cierra el ciclo</p>
        </div>
        {review?.cerrada && (
          <span className="ml-auto rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
            Semana cerrada
          </span>
        )}
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Resumen automático */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-[#0d1520] border border-[#1e2a3a] p-3 text-center">
            <p className="text-2xl font-bold text-white">{publicados}/3</p>
            <p className="text-xs text-gray-500 mt-0.5">Posts publicados</p>
          </div>
          <div className="rounded-lg bg-[#0d1520] border border-[#1e2a3a] p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{totalMensajes}</p>
            <p className="text-xs text-gray-500 mt-0.5">Mensajes recibidos</p>
          </div>
          <div className="rounded-lg bg-[#0d1520] border border-[#1e2a3a] p-3 text-center">
            <p className="text-2xl font-bold text-cyan-400">{ventas}</p>
            <p className="text-xs text-gray-500 mt-0.5">Ventas cerradas</p>
          </div>
        </div>

        {/* Ventas cerradas */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">
            Ventas cerradas esta semana
          </label>
          <input
            type="number"
            min={0}
            value={ventas}
            onChange={(e) => setVentas(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-28 rounded-lg border border-[#1e2a3a] bg-[#0d1520] px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Notas */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">
            Notas — qué funcionó, qué mejorar
          </label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-[#1e2a3a] bg-[#0d1520] px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none resize-y"
            placeholder="Ej: El post del miércoles generó más mensajes que el del lunes. Probar con video la próxima semana..."
          />
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGuardar}
            disabled={guardando || review?.cerrada}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:opacity-60"
          >
            {guardando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Guardar review
          </button>
          {!review?.cerrada && (
            <button
              onClick={handleCerrar}
              disabled={cerrando || !review?.id}
              className="flex items-center gap-1.5 rounded-lg bg-yellow-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-yellow-800 disabled:opacity-60"
            >
              {cerrando ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Cerrar semana y generar nueva
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  productosActivos: Producto[];
}

export default function PublicacionesAdmin({ productosActivos }: Props) {
  const whatsapp =
    process.env.NEXT_PUBLIC_GARSHOP_WHATSAPP_NUMBER ?? "";

  const [semanaInicio, setSemanaInicio] = useState<string>(
    getLunesDeEstaSemana
  );
  const [planes, setPlanes] = useState<PlanPublicacion[]>([]);
  const [review, setReview] = useState<SemanaReview | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCargando(true);

    Promise.all([
      supabase
        .from("garshop_plan_publicacion")
        .select("*")
        .eq("semana_inicio", semanaInicio),
      supabase
        .from("garshop_semana_review")
        .select("*")
        .eq("semana_inicio", semanaInicio)
        .maybeSingle(),
    ]).then(([{ data: planData }, { data: reviewData }]) => {
      if (cancelado) return;
      setPlanes((planData as PlanPublicacion[]) ?? []);
      setReview(reviewData as SemanaReview | null);
      setCargando(false);
    });

    return () => {
      cancelado = true;
    };
  }, [semanaInicio]);

  const getPlanDia = (dia: DiaPlan): PlanPublicacion | null =>
    planes.find((p) => p.dia === dia) ?? null;

  const handleSavePlan = (updated: PlanPublicacion) => {
    setPlanes((prev) => {
      const idx = prev.findIndex((p) => p.id === updated.id);
      if (idx >= 0) {
        const arr = [...prev];
        arr[idx] = updated;
        return arr;
      }
      return [...prev, updated];
    });
  };

  const handleMarcarPublicado = (id: string) => {
    setPlanes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, publicado: true } : p))
    );
  };

  const handleCerrarSemana = () => {
    const proxima = getLunesProximaSemana(semanaInicio);
    setSemanaInicio(proxima);
  };

  const semanaAnterior = () => {
    const d = new Date(semanaInicio + "T12:00:00");
    d.setDate(d.getDate() - 7);
    setSemanaInicio(d.toISOString().slice(0, 10));
  };

  const semanaActual = getLunesDeEstaSemana();
  const esEstaSemana = semanaInicio === semanaActual;

  const publicados = planes.filter((p) => p.publicado).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Plan de Publicación</h1>
          <p className="text-sm text-gray-500">
            {formatFechaSemana(semanaInicio)}
            {esEstaSemana && (
              <span className="ml-2 rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-medium text-cyan-400">
                Esta semana
              </span>
            )}
          </p>
        </div>

        {/* Navegación semanas */}
        <div className="flex items-center gap-2">
          <button
            onClick={semanaAnterior}
            className="rounded-lg border border-[#1e2a3a] px-3 py-1.5 text-xs text-gray-400 transition hover:bg-[#1a2535] hover:text-white"
          >
            ← Semana anterior
          </button>
          {!esEstaSemana && (
            <button
              onClick={() => setSemanaInicio(semanaActual)}
              className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-cyan-700"
            >
              Hoy
            </button>
          )}
          <button
            onClick={() =>
              setSemanaInicio(getLunesProximaSemana(semanaInicio))
            }
            className="rounded-lg border border-[#1e2a3a] px-3 py-1.5 text-xs text-gray-400 transition hover:bg-[#1a2535] hover:text-white"
          >
            Semana siguiente →
          </button>
        </div>
      </div>

      {/* Progreso de la semana */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex-1 rounded-full bg-[#1e2a3a] h-2 overflow-hidden">
          <div
            className="h-full rounded-full bg-cyan-500 transition-all duration-500"
            style={{ width: `${(publicados / 3) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 shrink-0">
          {publicados}/3 publicados
        </span>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Slots lunes / miércoles / viernes */}
          {DIAS_CONFIG.map(({ dia }) => (
            <SlotDia
              key={dia}
              dia={dia}
              plan={getPlanDia(dia)}
              semanaInicio={semanaInicio}
              productos={productosActivos}
              whatsapp={whatsapp}
              onSave={handleSavePlan}
              onMarcarPublicado={handleMarcarPublicado}
            />
          ))}

          {/* Separador */}
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 border-t border-[#1e2a3a]" />
            <Calendar className="h-4 w-4 text-gray-600" />
            <div className="flex-1 border-t border-[#1e2a3a]" />
          </div>

          {/* Review domingo */}
          <ReviewDomingo
            review={review}
            semanaInicio={semanaInicio}
            planes={planes}
            onSave={setReview}
            onCerrarSemana={handleCerrarSemana}
          />
        </div>
      )}
    </div>
  );
}
