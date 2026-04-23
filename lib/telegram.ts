import { ItemCarrito } from "./types";

interface NotificacionPedido {
  pedidoId: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteDireccion: string;
  items: ItemCarrito[];
  total: number;
  notas: string | null;
}

/**
 * Envía una notificación de pedido nuevo al chat de Telegram configurado.
 * Solo debe llamarse desde el servidor (Route Handler / Server Action).
 * Retorna true si el mensaje fue enviado con éxito, false en caso de error
 * (no lanza excepción para que el flujo de pedido nunca quede bloqueado por esto).
 */
export async function notificarPedidoTelegram(
  pedido: NotificacionPedido
): Promise<boolean> {
  const token = process.env.GARSHOP_TELEGRAM_BOT_TOKEN;
  const chatId = process.env.GARSHOP_TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    // Variables no configuradas: se omite la notificación silenciosamente.
    // El pedido sigue adelante sin problema.
    return false;
  }

  const lineasProductos = pedido.items
    .map(
      (item) =>
        `  • ${item.cantidad}x ${item.producto.nombre} — RD$${(item.producto.precio * item.cantidad).toLocaleString("es-DO")}`
    )
    .join("\n");

  const totalFormateado = `RD$${pedido.total.toLocaleString("es-DO")}`;

  const telLink = pedido.clienteTelefono.replace(/\D/g, "");

  const lines = [
    "🛒 *Nuevo pedido — GarShop\\.rd*",
    "",
    `*ID:* \`${pedido.pedidoId.slice(0, 8)}\``,
    "",
    `*Cliente:* ${escapeMarkdown(pedido.clienteNombre)}`,
    `*Teléfono:* [${escapeMarkdown(pedido.clienteTelefono)}](https://wa.me/${telLink})`,
    `*Dirección:* ${escapeMarkdown(pedido.clienteDireccion)}`,
    pedido.notas
      ? `*Notas:* ${escapeMarkdown(pedido.notas)}`
      : null,
    "",
    "*Productos:*",
    escapeMarkdown(lineasProductos),
    "",
    `*Total: ${escapeMarkdown(totalFormateado)}*`,
    "",
    "_Pago: Transferencia o efectivo al recibir_",
  ]
    .filter((l) => l !== null)
    .join("\n");

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: lines,
          parse_mode: "MarkdownV2",
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      console.error(
        `[GarShop Telegram] Error al enviar notificación: ${res.status} ${body}`
      );
      return false;
    }

    return true;
  } catch (err) {
    console.error("[GarShop Telegram] Error de red al notificar:", err);
    return false;
  }
}

/**
 * Escapa caracteres reservados de MarkdownV2 de Telegram.
 * Ref: https://core.telegram.org/bots/api#markdownv2-style
 */
function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, (c) => `\\${c}`);
}
