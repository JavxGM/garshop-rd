import { ItemCarrito } from "./types";

export function generarMensajeWhatsApp(
  items: ItemCarrito[],
  nombre: string,
  telefono: string,
  direccion: string,
  notas: string
): string {
  const numero = process.env.NEXT_PUBLIC_GARSHOP_WHATSAPP_NUMBER ?? "";

  const lineas = items.map(
    (item) =>
      `• ${item.cantidad}x ${item.producto.nombre} — RD$${(item.producto.precio * item.cantidad).toLocaleString("es-DO")}`
  );

  const total = items.reduce(
    (acc, item) => acc + item.producto.precio * item.cantidad,
    0
  );

  const mensaje = [
    "🛒 *Nuevo pedido - GarShop.rd*",
    "",
    "*Cliente:* " + nombre,
    "*Teléfono:* " + telefono,
    "*Dirección:* " + direccion,
    notas ? "*Notas:* " + notas : null,
    "",
    "*Productos:*",
    ...lineas,
    "",
    `*Total: RD$${total.toLocaleString("es-DO")}*`,
    "",
    "_Pago: Transferencia o efectivo al recibir_",
  ]
    .filter((l) => l !== null)
    .join("\n");

  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
