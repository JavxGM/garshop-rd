import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { notificarPedidoTelegram } from "@/lib/telegram";
import { ItemCarrito } from "@/lib/types";

interface PedidoPayload {
  clienteNombre: string;
  clienteTelefono: string;
  clienteDireccion: string;
  items: ItemCarrito[];
  total: number;
  notas?: string;
}

// Valida teléfonos dominicanos: 809, 829, 849 con o sin prefijo 1
function esTelefonoDominicanoValido(tel: string): boolean {
  const limpio = tel.replace(/\D/g, "");
  return /^1?(809|829|849)\d{7}$/.test(limpio);
}

function validarPayload(
  body: unknown
): { ok: true; data: PedidoPayload } | { ok: false; mensaje: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, mensaje: "Cuerpo de la solicitud inválido" };
  }

  const b = body as Record<string, unknown>;

  if (!b.clienteNombre || typeof b.clienteNombre !== "string" || !b.clienteNombre.trim()) {
    return { ok: false, mensaje: "El nombre del cliente es requerido" };
  }

  if (!b.clienteTelefono || typeof b.clienteTelefono !== "string") {
    return { ok: false, mensaje: "El teléfono es requerido" };
  }

  if (!esTelefonoDominicanoValido(b.clienteTelefono)) {
    return {
      ok: false,
      mensaje: "El teléfono debe ser un número dominicano válido (809, 829 o 849)",
    };
  }

  if (
    !b.clienteDireccion ||
    typeof b.clienteDireccion !== "string" ||
    !b.clienteDireccion.trim()
  ) {
    return { ok: false, mensaje: "La dirección de entrega es requerida" };
  }

  if (!Array.isArray(b.items) || b.items.length === 0) {
    return { ok: false, mensaje: "El carrito no puede estar vacío" };
  }

  if (
    typeof b.total !== "number" ||
    !isFinite(b.total) ||
    b.total < 0
  ) {
    return { ok: false, mensaje: "El total del pedido es inválido" };
  }

  return {
    ok: true,
    data: {
      clienteNombre: b.clienteNombre.trim(),
      clienteTelefono: b.clienteTelefono.trim(),
      clienteDireccion: b.clienteDireccion.trim(),
      items: b.items as ItemCarrito[],
      total: b.total,
      notas: typeof b.notas === "string" ? b.notas.trim() || undefined : undefined,
    },
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "JSON inválido en el cuerpo de la solicitud" },
      { status: 400 }
    );
  }

  const validacion = validarPayload(body);
  if (!validacion.ok) {
    return NextResponse.json({ error: validacion.mensaje }, { status: 422 });
  }

  const { data: pedido } = validacion;

  // Usamos el cliente de Supabase con la service role key en el servidor
  // para evitar depender del anon key del cliente para operaciones críticas.
  // Fallback al anon key si no hay service role (desarrollo local sin .env.local).
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "placeholder-key";

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: pedidoInsertado, error: errorSupabase } = await supabase
    .from("garshop_pedidos")
    .insert({
      cliente_nombre: pedido.clienteNombre,
      cliente_telefono: pedido.clienteTelefono,
      cliente_direccion: pedido.clienteDireccion,
      items: pedido.items,
      total: pedido.total,
      estado: "pendiente",
      notas: pedido.notas ?? null,
    })
    .select("id")
    .single();

  if (errorSupabase || !pedidoInsertado) {
    console.error("[GarShop Pedidos] Error Supabase:", errorSupabase?.message);
    return NextResponse.json(
      { error: "No se pudo guardar el pedido. Intenta de nuevo." },
      { status: 500 }
    );
  }

  // Notificación Telegram: no bloqueante. Si falla, el pedido ya fue guardado.
  void notificarPedidoTelegram({
    pedidoId: pedidoInsertado.id,
    clienteNombre: pedido.clienteNombre,
    clienteTelefono: pedido.clienteTelefono,
    clienteDireccion: pedido.clienteDireccion,
    items: pedido.items,
    total: pedido.total,
    notas: pedido.notas ?? null,
  });

  return NextResponse.json({ ok: true, pedidoId: pedidoInsertado.id });
}
