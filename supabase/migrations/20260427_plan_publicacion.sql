-- Tabla: plan de publicación semanal (lunes, miércoles, viernes)
CREATE TABLE IF NOT EXISTS garshop_plan_publicacion (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semana_inicio DATE NOT NULL,
  dia           TEXT NOT NULL CHECK (dia IN ('lunes', 'miercoles', 'viernes')),
  producto_id   UUID REFERENCES garshop_productos(id) ON DELETE SET NULL,
  tipo_contenido TEXT NOT NULL CHECK (tipo_contenido IN ('producto_directo', 'problema_solucion', 'cta_directo')),
  caption       TEXT NOT NULL DEFAULT '',
  canales       JSONB NOT NULL DEFAULT '{"instagram": true, "facebook": true, "marketplace": ""}',
  publicado     BOOLEAN NOT NULL DEFAULT false,
  mensajes_recibidos INT NOT NULL DEFAULT 0 CHECK (mensajes_recibidos >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para buscar la semana activa rápidamente
CREATE INDEX IF NOT EXISTS idx_garshop_plan_publicacion_semana
  ON garshop_plan_publicacion (semana_inicio DESC);

-- Tabla: review / cierre de semana
CREATE TABLE IF NOT EXISTS garshop_semana_review (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semana_inicio   DATE NOT NULL UNIQUE,
  ventas_cerradas INT NOT NULL DEFAULT 0 CHECK (ventas_cerradas >= 0),
  notas           TEXT NOT NULL DEFAULT '',
  cerrada         BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: acceso completo via anon key (mismo patrón que el resto de tablas garshop)
ALTER TABLE garshop_plan_publicacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE garshop_semana_review    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "garshop_plan_publicacion_all"
  ON garshop_plan_publicacion FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "garshop_semana_review_all"
  ON garshop_semana_review FOR ALL USING (true) WITH CHECK (true);
