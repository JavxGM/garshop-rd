import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

export const metadata: Metadata = {
  title: "GarShop.rd — Electrónicos en República Dominicana",
  description:
    "Micrófonos, adaptadores, cables y accesorios tech en República Dominicana. Precios en RD$, entrega a domicilio. Pedidos por WhatsApp.",
  keywords: "electrónicos, micrófono, adaptador, cable, audio, accesorios, República Dominicana, GarShop",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
