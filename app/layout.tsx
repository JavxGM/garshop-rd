import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

export const metadata: Metadata = {
  title: "GarShop.rd — Electrónicos en República Dominicana",
  description:
    "Micrófonos, adaptadores, cables y accesorios tech en República Dominicana. Precios en RD$, entrega a domicilio. Pedidos por WhatsApp.",
  keywords: "electrónicos, micrófono, adaptador, cable, audio, accesorios, República Dominicana, GarShop",
  openGraph: {
    title: "GarShop.rd — Electrónicos en República Dominicana",
    description:
      "Micrófonos, adaptadores, cables y accesorios tech. Precios en RD$, entrega a domicilio en todo el país. Pedidos por WhatsApp.",
    type: "website",
    locale: "es_DO",
    siteName: "GarShop.rd",
  },
  twitter: {
    card: "summary_large_image",
    title: "GarShop.rd — Electrónicos en República Dominicana",
    description:
      "Micrófonos, adaptadores, cables y accesorios tech. Precios en RD$, entrega a domicilio.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0f1a",
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
