-- ============================================
-- GarShop.rd — Schema de base de datos Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Nota: usa prefijo garshop_ para coexistir con
--       tablas de GainRD en el mismo proyecto.
-- ============================================

-- Tabla de productos
CREATE TABLE IF NOT EXISTS public.garshop_productos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  precio      NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  imagen_url  TEXT,
  categoria   TEXT NOT NULL DEFAULT 'otro'
              CHECK (categoria IN ('microfono', 'adaptador', 'cable', 'audio', 'accesorios', 'otro')),
  activo      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de pedidos
CREATE TABLE IF NOT EXISTS public.garshop_pedidos (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_nombre     TEXT NOT NULL,
  cliente_telefono   TEXT NOT NULL,
  cliente_direccion  TEXT NOT NULL,
  items              JSONB NOT NULL DEFAULT '[]',
  total              NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  estado             TEXT NOT NULL DEFAULT 'pendiente'
                     CHECK (estado IN ('pendiente', 'confirmado', 'entregado', 'cancelado')),
  notas              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_garshop_productos_activo ON public.garshop_productos (activo);
CREATE INDEX IF NOT EXISTS idx_garshop_productos_categoria ON public.garshop_productos (categoria);
CREATE INDEX IF NOT EXISTS idx_garshop_pedidos_estado ON public.garshop_pedidos (estado);
CREATE INDEX IF NOT EXISTS idx_garshop_pedidos_created_at ON public.garshop_pedidos (created_at DESC);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE public.garshop_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garshop_pedidos ENABLE ROW LEVEL SECURITY;

-- Productos: lectura pública solo activos, escritura sin auth (usamos password en frontend)
CREATE POLICY "garshop_productos_lectura_publica" ON public.garshop_productos
  FOR SELECT USING (activo = true);

CREATE POLICY "garshop_productos_admin_todo" ON public.garshop_productos
  FOR ALL USING (true);

-- Pedidos: inserción pública (el cliente crea el pedido), admin ve todo
CREATE POLICY "garshop_pedidos_insertar_publico" ON public.garshop_pedidos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "garshop_pedidos_admin_todo" ON public.garshop_pedidos
  FOR ALL USING (true);

-- ============================================
-- Catálogo inicial de productos electrónicos
-- ============================================

INSERT INTO public.garshop_productos (nombre, descripcion, precio, stock, categoria) VALUES
  -- Micrófonos
  ('Blue Yeti USB Microfono', 'Micrófono USB profesional con patrón cardioide, estéreo, omnidireccional y bidireccional. Ideal para podcasts, streaming y grabación. Plug & play.', 12000, 3, 'microfono'),
  ('HyperX QuadCast S Microfono', 'Micrófono USB RGB con anti-vibración integrado. 4 patrones polares, filtro anti-pop incluido. Perfecto para streaming y gaming.', 10500, 4, 'microfono'),
  ('Razer Seiren Mini Microfono', 'Micrófono USB compacto con patrón supercardioide. Diseño ultra-compacto ideal para escritorios pequeños. 96kHz/24-bit.', 4800, 5, 'microfono'),
  -- Adaptadores
  ('Adaptador USB-C a HDMI 4K', 'Adaptador USB-C a HDMI con soporte 4K@60Hz. Compatible con MacBook, iPad Pro, laptops Windows con USB-C. Plug & play, sin drivers.', 1200, 10, 'adaptador'),
  ('Hub USB-C 7 en 1', 'Hub multipuerto: HDMI 4K, 3x USB-A 3.0, USB-C PD 100W, lector SD/microSD. Compatible con MacBook Pro/Air, laptops USB-C.', 2800, 6, 'adaptador'),
  ('Adaptador USB-C a USB-A 3.0', 'Adaptador compacto USB-C macho a USB-A hembra. Transferencia hasta 5Gbps. Aluminio premium. Compatible con cualquier dispositivo USB-C.', 450, 20, 'adaptador'),
  ('Adaptador DisplayPort a HDMI', 'Adaptador DisplayPort macho a HDMI hembra. Resolución hasta 1080p@60Hz. Compatible con tarjetas gráficas NVIDIA y AMD.', 700, 8, 'adaptador'),
  -- Cables
  ('Cable HDMI 2.1 8K 2m', 'Cable HDMI 2.1 ultra-alta velocidad. Soporta 8K@60Hz y 4K@120Hz. Compatible con PS5, Xbox Series X, NVIDIA RTX 40 series.', 950, 12, 'cable'),
  ('Cable USB-C a USB-C 240W 2m', 'Cable USB-C con carga rápida 240W y transferencia 40Gbps (USB4). Compatible con MacBook Pro, iPad Pro, laptops y cámaras.', 800, 15, 'cable'),
  -- Audio
  ('Auriculares Sony WH-1000XM5', 'Auriculares inalámbricos con cancelación de ruido líder en su clase. 30 horas de batería, carga rápida, calidad de audio Hi-Res.', 18500, 2, 'audio'),
  ('Auriculares HyperX Cloud II Gaming', 'Auriculares gaming con sonido virtual 7.1. Drivers de 53mm, micrófono extraíble con cancelación de ruido. Compatible PC, PS4/PS5.', 5500, 5, 'audio'),
  -- Accesorios
  ('Soporte Articulado Monitor Doble', 'Soporte doble para monitores de 13"-32". Brazo articulado con ajuste completo (altura, inclinación, giro). Capacidad 2x10kg.', 3200, 4, 'accesorios'),
  ('Capturadora HDMI 4K USB', 'Tarjeta capturadora HDMI a USB-C/USB-A. Captura hasta 4K@30fps, transmisión 1080p@60fps. Compatible OBS, Streamlabs, Teams.', 2500, 3, 'accesorios')
ON CONFLICT DO NOTHING;
