export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import { Producto, Categoria } from "@/lib/types";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import CartDrawer from "@/components/CartDrawer";
import { Cpu, MessageCircle, MapPin, Clock, ShoppingCart, CheckCircle, Truck } from "lucide-react";

const CATEGORIAS: { valor: Categoria; etiqueta: string; emoji: string }[] = [
  { valor: "microfono", etiqueta: "Micrófonos", emoji: "🎙️" },
  { valor: "adaptador", etiqueta: "Adaptadores", emoji: "🔌" },
  { valor: "cable", etiqueta: "Cables", emoji: "🔋" },
  { valor: "audio", etiqueta: "Audio", emoji: "🎧" },
  { valor: "accesorios", etiqueta: "Accesorios", emoji: "🖥️" },
  { valor: "otro", etiqueta: "Otros", emoji: "📦" },
];

async function getProductos(): Promise<Producto[]> {
  try {
    const { data, error } = await supabase
      .from("garshop_productos")
      .select("*")
      .eq("activo", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const productos = await getProductos();

  const productosPorCategoria = CATEGORIAS.map((cat) => ({
    ...cat,
    productos: productos.filter((p) => p.categoria === cat.valor),
  })).filter((cat) => cat.productos.length > 0);

  const whatsapp = process.env.NEXT_PUBLIC_GARSHOP_WHATSAPP_NUMBER ?? "";

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <Navbar />
      <CartDrawer />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#1e2a3a] bg-gradient-to-br from-[#0a0f1a] via-[#0d1a2e] to-[#0a0f1a] py-20">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-5">
          <Cpu className="h-96 w-96 text-cyan-400" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <span className="mb-4 inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400">
            🇩🇴 República Dominicana
          </span>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white md:text-6xl">
            Tu tienda de<br />
            <span className="text-cyan-400">electrónicos</span> en RD
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-lg text-gray-400">
            Micrófonos, adaptadores, cables y accesorios tech. Precios en RD$,
            entrega a domicilio en toda República Dominicana.
          </p>
          <a
            href="#productos"
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-8 py-3 font-semibold text-white transition hover:bg-cyan-600 active:scale-95"
          >
            Ver productos
          </a>
          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              Entrega a domicilio
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              Pago contra entrega
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              Garantía de producto
            </div>
          </div>
        </div>
      </section>

      {/* Cómo comprar */}
      <section className="border-b border-[#1e2a3a] bg-[#0d1520]">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-widest text-cyan-400">
            ¿Cómo comprar?
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-white">1. Elige tu producto</p>
                <p className="text-sm text-gray-500">
                  Añade lo que quieres al carrito y ajusta la cantidad.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-white">2. Envía por WhatsApp</p>
                <p className="text-sm text-gray-500">
                  Completa tus datos y te llegará el mensaje listo para enviar.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-white">3. Recibe en casa</p>
                <p className="text-sm text-gray-500">
                  Coordinamos la entrega. Pago en efectivo o transferencia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section id="categorias" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-xl font-bold text-white">Categorías</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {CATEGORIAS.map((cat) => (
            <a
              key={cat.valor}
              href={`#cat-${cat.valor}`}
              className="flex flex-col items-center gap-2 rounded-xl border border-[#1e2a3a] bg-[#0d1520] p-4 text-center transition hover:border-cyan-500/50 hover:bg-[#111c2a]"
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-xs font-medium text-gray-300">
                {cat.etiqueta}
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Productos */}
      <section id="productos" className="mx-auto max-w-6xl px-4 pb-16">
        {productos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Cpu className="mb-4 h-16 w-16 text-gray-700" />
            <h3 className="mb-2 text-lg font-semibold text-gray-400">
              Próximamente
            </h3>
            <p className="text-sm text-gray-600">
              Estamos cargando el inventario. Escríbenos por WhatsApp para
              preguntar disponibilidad.
            </p>
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
            >
              <MessageCircle className="h-5 w-5" />
              WhatsApp
            </a>
          </div>
        ) : (
          <>
            {productosPorCategoria.map((cat) => (
              <div key={cat.valor} id={`cat-${cat.valor}`} className="mb-12">
                <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-white">
                  <span>{cat.emoji}</span>
                  {cat.etiqueta}
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {cat.productos.map((producto, i) => (
                    <ProductCard
                      key={producto.id}
                      producto={producto}
                      priority={i < 4 && cat.valor === productosPorCategoria[0]?.valor}
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </section>

      {/* Contacto */}
      <section
        id="contacto"
        className="border-t border-[#1e2a3a] bg-[#0d1520]"
      >
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="mb-8 text-2xl font-bold text-white">Contacto</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-xl border border-[#1e2a3a] bg-[#0a0f1a] p-5">
              <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />
              <div>
                <p className="mb-1 font-semibold text-white">WhatsApp</p>
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 hover:text-cyan-400"
                >
                  Escríbenos directo
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-[#1e2a3a] bg-[#0a0f1a] p-5">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />
              <div>
                <p className="mb-1 font-semibold text-white">Ubicación</p>
                <p className="text-sm text-gray-400">
                  República Dominicana
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-[#1e2a3a] bg-[#0a0f1a] p-5">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />
              <div>
                <p className="mb-1 font-semibold text-white">Horario</p>
                <p className="text-sm text-gray-400">Lun – Sáb: 9am – 7pm</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1e2a3a] bg-[#0a0f1a] px-4 py-6 text-center">
        <p className="text-sm text-gray-600">
          © {new Date().getFullYear()} GarShop.rd — República Dominicana
        </p>
      </footer>
    </div>
  );
}
