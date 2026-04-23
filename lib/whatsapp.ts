import { ItemCarrito } from "./types";

/**
 * Retorna el número de WhatsApp configurado para GarShop.rd.
 * Lanza un error descriptivo si la variable de entorno no está definida,
 * para que el fallo sea visible durante desarrollo y no silencioso en producción.
 */
export function getWhatsAppNumero(): string {
  const numero = process.env.NEXT_PUBLIC_GARSHOP_WHATSAPP_NUMBER;
  if (!numero || numero.trim() === "") {
    throw new Error(
      "NEXT_PUBLIC_GARSHOP_WHATSAPP_NUMBER no está configurada. " +
        "Agrégala en .env.local (desarrollo) o en las variables de entorno de Vercel (producción)."
    );
  }
  // Elimina cualquier caracter que no sea dígito para garantizar formato limpio
  return numero.replace(/\D/g, "");
}

/**
 * Construye el mensaje de WhatsApp con el detalle del pedido y retorna
 * la URL completa wa.me lista para abrir en el navegador.
 */
export function generarMensajeWhatsApp(
  items: ItemCarrito[],
  nombre: string,
  telefono: string,
  direccion: string,
  notas: string
): string {
  const numero = getWhatsAppNumero();

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
    `*Cliente:* ${nombre}`,
    `*Teléfono:* ${telefono}`,
    `*Dirección:* ${direccion}`,
    notas ? `*Notas:* ${notas}` : null,
    "",
    "*Productos:*",
    ...lineas,
    "",
    `*Total: RD$${total.toLocaleString("es-DO")}*`,
    "",
    "_Pago: Transferencia o efectivo al recibir_",
  ]
    .filter((l): l is string => l !== null)
    .join("\n");

  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
