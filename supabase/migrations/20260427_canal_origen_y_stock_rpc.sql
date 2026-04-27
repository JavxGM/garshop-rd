-- ============================================
-- GarShop.rd — Migración: canal_origen + RPC decrementar_stock
-- Fecha: 2026-04-27
-- ============================================

-- --------------------------------------------
-- 1. Agregar columna canal_origen a garshop_pedidos
-- --------------------------------------------
-- Nullable para no romper registros existentes.
-- Valores posibles: 'web', 'whatsapp', 'facebook'.
ALTER TABLE public.garshop_pedidos
  ADD COLUMN IF NOT EXISTS canal_origen TEXT
  CHECK (canal_origen IN ('web', 'whatsapp', 'facebook'));

-- --------------------------------------------
-- 2. Función RPC: decrementar_stock
-- --------------------------------------------
-- Descuenta `cantidad` del stock del producto identificado por `producto_id`.
-- Usa SELECT ... FOR UPDATE para serializar pedidos simultáneos sobre el mismo producto.
-- Lanza excepción si el stock resultante quedaría negativo.
--
-- Uso desde cliente Supabase:
--   supabase.rpc('decrementar_stock', { producto_id: '...', cantidad: 2 })
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.decrementar_stock(
  producto_id UUID,
  cantidad    INT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stock_actual INT;
BEGIN
  -- Bloquea la fila para evitar race conditions con pedidos concurrentes.
  SELECT stock
    INTO stock_actual
    FROM public.garshop_productos
   WHERE id = producto_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Producto no encontrado: %', producto_id
      USING ERRCODE = 'P0002';
  END IF;

  IF stock_actual < cantidad THEN
    RAISE EXCEPTION 'Stock insuficiente para el producto %. Stock disponible: %, solicitado: %',
      producto_id, stock_actual, cantidad
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.garshop_productos
     SET stock = stock - cantidad
   WHERE id = producto_id;
END;
$$;

-- Revocar acceso público por defecto y permitir solo al rol de servicio.
-- La función usa SECURITY DEFINER, así que se ejecuta con privilegios del owner.
REVOKE EXECUTE ON FUNCTION public.decrementar_stock(UUID, INT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.decrementar_stock(UUID, INT) TO service_role;
