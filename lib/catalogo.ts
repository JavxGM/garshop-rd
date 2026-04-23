import { Categoria } from "./types";

export interface ProductoSemilla {
  nombre: string;
  descripcion: string;
  precio_venta: number;
  precio_compra: number | null;
  stock: number;
  imagen_url: string | null;
  categoria: Categoria;
  activo: boolean;
}

export const CATALOGO_INICIAL: ProductoSemilla[] = [
  // Micrófonos
  {
    nombre: "Blue Yeti USB Microfono",
    descripcion: "Micrófono USB profesional con patrón cardioide, estéreo, omnidireccional y bidireccional. Ideal para podcasts, streaming y grabación. Plug & play.",
    precio: 12000,
    stock: 3,
    imagen_url: null,
    categoria: "microfono",
    activo: true,
  },
  {
    nombre: "HyperX QuadCast S Microfono",
    descripcion: "Micrófono USB RGB con anti-vibración integrado. 4 patrones polares, filtro anti-pop incluido. Perfecto para streaming y gaming.",
    precio: 10500,
    stock: 4,
    imagen_url: null,
    categoria: "microfono",
    activo: true,
  },
  {
    nombre: "Razer Seiren Mini Microfono",
    descripcion: "Micrófono USB compacto con patrón supercardioide. Diseño ultra-compacto ideal para escritorios pequeños. 96kHz/24-bit.",
    precio: 4800,
    stock: 5,
    imagen_url: null,
    categoria: "microfono",
    activo: true,
  },
  // Adaptadores
  {
    nombre: "Adaptador USB-C a HDMI 4K",
    descripcion: "Adaptador USB-C a HDMI con soporte 4K@60Hz. Compatible con MacBook, iPad Pro, laptops Windows con USB-C. Plug & play, sin drivers.",
    precio: 1200,
    stock: 10,
    imagen_url: null,
    categoria: "adaptador",
    activo: true,
  },
  {
    nombre: "Hub USB-C 7 en 1",
    descripcion: "Hub multipuerto: HDMI 4K, 3x USB-A 3.0, USB-C PD 100W, lector SD/microSD. Compatible con MacBook Pro/Air, laptops USB-C.",
    precio: 2800,
    stock: 6,
    imagen_url: null,
    categoria: "adaptador",
    activo: true,
  },
  {
    nombre: "Adaptador USB-C a USB-A 3.0",
    descripcion: "Adaptador compacto USB-C macho a USB-A hembra. Transferencia hasta 5Gbps. Aluminio premium. Compatible con cualquier dispositivo USB-C.",
    precio: 450,
    stock: 20,
    imagen_url: null,
    categoria: "adaptador",
    activo: true,
  },
  {
    nombre: "Adaptador DisplayPort a HDMI",
    descripcion: "Adaptador DisplayPort macho a HDMI hembra. Resolución hasta 1080p@60Hz. Compatible con tarjetas gráficas NVIDIA y AMD.",
    precio: 700,
    stock: 8,
    imagen_url: null,
    categoria: "adaptador",
    activo: true,
  },
  // Cables
  {
    nombre: "Cable HDMI 2.1 8K 2m",
    descripcion: "Cable HDMI 2.1 ultra-alta velocidad. Soporta 8K@60Hz y 4K@120Hz. Compatible con PS5, Xbox Series X, NVIDIA RTX 40 series.",
    precio: 950,
    stock: 12,
    imagen_url: null,
    categoria: "cable",
    activo: true,
  },
  {
    nombre: "Cable USB-C a USB-C 240W 2m",
    descripcion: "Cable USB-C con carga rápida 240W y transferencia 40Gbps (USB4). Compatible con MacBook Pro, iPad Pro, laptops y cámaras.",
    precio: 800,
    stock: 15,
    imagen_url: null,
    categoria: "cable",
    activo: true,
  },
  // Audio
  {
    nombre: "Auriculares Sony WH-1000XM5",
    descripcion: "Auriculares inalámbricos con cancelación de ruido líder en su clase. 30 horas de batería, carga rápida, calidad de audio Hi-Res.",
    precio: 18500,
    stock: 2,
    imagen_url: null,
    categoria: "audio",
    activo: true,
  },
  {
    nombre: "Auriculares HyperX Cloud II Gaming",
    descripcion: "Auriculares gaming con sonido virtual 7.1. Drivers de 53mm, micrófono extraíble con cancelación de ruido. Compatible PC, PS4/PS5.",
    precio: 5500,
    stock: 5,
    imagen_url: null,
    categoria: "audio",
    activo: true,
  },
  // Accesorios
  {
    nombre: "Soporte Articulado Monitor Doble",
    descripcion: "Soporte doble para monitores de 13\"-32\". Brazo articulado con ajuste completo (altura, inclinación, giro). Capacidad 2x10kg.",
    precio: 3200,
    stock: 4,
    imagen_url: null,
    categoria: "accesorios",
    activo: true,
  },
  {
    nombre: "Capturadora HDMI 4K USB",
    descripcion: "Tarjeta capturadora HDMI a USB-C/USB-A. Captura hasta 4K@30fps, transmisión 1080p@60fps. Compatible OBS, Streamlabs, Teams.",
    precio: 2500,
    stock: 3,
    imagen_url: null,
    categoria: "accesorios",
    activo: true,
  },
  // Adaptadores (continuación)
  {
    nombre: "Adaptador HDMI a VGA",
    descripcion: "Adaptador HDMI macho a VGA hembra. Conecta laptops y PCs modernos a monitores y proyectores con entrada VGA. Resolución hasta 1080p@60Hz. Plug & play, sin drivers. Ideal para oficinas y aulas.",
    precio: 650,
    stock: 15,
    imagen_url: null,
    categoria: "adaptador",
    activo: true,
  },
  // Micrófonos (continuación)
  {
    nombre: "Micrófono K8 para Teléfono",
    descripcion: "Micrófono de solapa (lavalier) con conector de 3.5mm TRRS para smartphones. Clip compacto, omnidireccional, cable 1.5m. Ideal para creadores de contenido, entrevistas y reels. Compatible con iPhone y Android.",
    precio: 850,
    stock: 20,
    imagen_url: null,
    categoria: "microfono",
    activo: true,
  },
];
