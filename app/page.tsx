export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import { Producto } from "@/lib/types";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import CatalogoClient from "@/components/CatalogoClient";
import { Cpu, MessageCircle, MapPin, Clock, ShoppingCart, CheckCircle, Truck } from "lucide-react";

// Solo campos públicos — precio_compra excluido
async function getProductos(): Promise<Producto[]> {
  try {
    const { data, error } = await supabase
      .from("garshop_productos")
      .select(`
        id, nombre, descripcion, precio_venta, stock, imagen_url, categoria, activo, created_at,
        garshop_producto_imagenes!producto_id(url, orden, es_principal)
      `)
      .eq("activo", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data ?? []).map((p) => {
      const imgs = (p.garshop_producto_imagenes ?? []) as {
        url: string;
        orden: number;
        es_principal: boolean;
      }[];
      const ordenadas = [...imgs].sort((a, b) => a.orden - b.orden);
      const principal = ordenadas.find((i) => i.es_principal)?.url ?? ordenadas[0]?.url ?? null;
      return {
        ...p,
        precio_compra: null,
        imagen_principal: principal,
        imagenes: ordenadas.map((i) => i.url),
        // imagen_url queda como fallback si imagen_principal es null
      } satisfies Producto;
    });
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const productos = await getProductos();
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

      {/* Catálogo: buscador + filtros + grilla — delegado a CatalogoClient */}
      {productos.length === 0 ? (
        <section id="productos" className="mx-auto max-w-6xl px-4 pb-16 pt-12">
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
        </section>
      ) : (
        <CatalogoClient productos={productos} />
      )}

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
