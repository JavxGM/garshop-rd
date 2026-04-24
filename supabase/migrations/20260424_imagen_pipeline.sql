-- ============================================================
-- GarShop.rd — Pipeline de imágenes
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Tabla de imágenes por producto (múltiples por producto, ordenadas)
CREATE TABLE IF NOT EXISTS public.garshop_producto_imagenes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID NOT NULL REFERENCES public.garshop_productos(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  orden       INT NOT NULL DEFAULT 0,
  es_principal BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_garshop_prod_imagenes_producto
  ON public.garshop_producto_imagenes (producto_id);

CREATE INDEX IF NOT EXISTS idx_garshop_prod_imagenes_principal
  ON public.garshop_producto_imagenes (producto_id, es_principal)
  WHERE es_principal = true;

-- 3. RLS
ALTER TABLE public.garshop_producto_imagenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "garshop_imagenes_lectura_publica" ON public.garshop_producto_imagenes
  FOR SELECT USING (true);

CREATE POLICY "garshop_imagenes_admin_todo" ON public.garshop_producto_imagenes
  FOR ALL USING (true);

-- 4. Migrar imagen_url existente → nueva tabla (solo filas con imagen)
INSERT INTO public.garshop_producto_imagenes (producto_id, url, orden, es_principal)
SELECT id, imagen_url, 0, true
FROM public.garshop_productos
WHERE imagen_url IS NOT NULL
  AND imagen_url <> ''
ON CONFLICT DO NOTHING;

-- NOTA: imagen_url se conserva en garshop_productos como fallback de compatibilidad.
-- Se eliminará en una migración futura cuando todas las imágenes estén en la tabla nueva.

-- 5. Tabla de conteo de uso de remove.bg (para alertas de límite mensual)
CREATE TABLE IF NOT EXISTS public.garshop_removebg_uso (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mes                  TEXT NOT NULL UNIQUE, -- formato 'YYYY-MM'
  imagenes_procesadas  INT NOT NULL DEFAULT 0,
  alerta_enviada       BOOLEAN NOT NULL DEFAULT false,
  ultima_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.garshop_removebg_uso ENABLE ROW LEVEL SECURITY;

-- Solo el service role puede leer/escribir esta tabla (operaciones server-side únicamente)
CREATE POLICY "garshop_removebg_uso_admin_todo" ON public.garshop_removebg_uso
  FOR ALL USING (true);
