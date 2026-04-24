# GarShop.rd — Roadmap

Canales de venta: sitio web + Facebook/Instagram Marketplace + WhatsApp Business Catalog + Instagram.

---

## Completado

- [x] Pipeline de imágenes: remove.bg + sharp (1000×1000 JPEG fondo blanco)
- [x] Tabla `garshop_producto_imagenes` (múltiples imágenes por producto)
- [x] Tabla `garshop_removebg_uso` (contador mensual + alerta email a los 40)
- [x] Componente `ImagenesProductoUpload` en el admin (upload múltiple, imagen principal)
- [x] Alerta por email vía Gmail (nodemailer) cuando se acerca al límite de remove.bg
- [x] Variables de entorno en Vercel: `REMOVEBG_API_KEY`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`
- [x] Migración aplicada en Supabase (proyecto GAIN-RD)

---

## Pendiente

### Dueño (no requiere código)

- [ ] Fotografiar productos y subir fotos desde el admin para los 3 productos actuales
- [ ] Crear cuenta en Meta Business Manager (business.facebook.com)
- [ ] Conectar el Data Feed (`/api/meta/catalog`) al catálogo de Facebook
- [ ] Vincular el catálogo de Facebook a WhatsApp Business

### Técnico (implementar en orden)

#### 1. OG Image + Metadata por producto
- [ ] Crear `/public/og-image.jpg` (imagen estática 1200×630 para el sitio)
- [ ] Agregar `openGraph.images` en `app/layout.tsx`
- [ ] Implementar `generateMetadata()` en `app/productos/[id]/page.tsx` con nombre, precio e imagen del producto
- **Por qué:** cuando se comparte un link en WhatsApp, Facebook o Instagram aparece el preview con imagen

#### 2. Decremento de stock al confirmar pedido
- [ ] Crear función RPC en Supabase: `decrementar_stock(producto_id, cantidad)`
- [ ] Llamar la RPC en `POST /api/pedidos/route.ts` al guardar el pedido
- [ ] Agregar campo `canal_origen` en `garshop_pedidos` (valores: `web`, `marketplace`, `whatsapp`, `instagram`)
- **Por qué:** con 3 canales activos el riesgo de overselling se multiplica

#### 3. Data Feed para Meta Catalog
- [ ] Implementar `GET /api/meta/catalog` que devuelva CSV/XML con los campos requeridos por Meta:
  - `id`, `title`, `description`, `price`, `currency`, `availability`, `condition`
  - `image_link` (imagen principal), `additional_image_link` (resto de imágenes)
  - `link` (URL del producto en el sitio)
  - `brand`, `category`
- [ ] Verificar que todos los productos tienen imágenes antes de activar (Meta rechaza items sin `image_link`)
- **Por qué:** una sola URL alimenta tanto Facebook Marketplace como WhatsApp Business Catalog

---

## Notas de arquitectura

- Supabase compartido con GainRD — proyecto `GAIN-RD` (`hmwgjsztpkhzbjoonlqf`). Todas las tablas llevan prefijo `garshop_`.
- remove.bg free tier: 50 imágenes/mes. Alerta de email al llegar a 40.
- Gmail App Password configurado en Vercel. Email destino: `garciamartinezjavier1004@gmail.com`.
- El catálogo de WhatsApp Business se sincroniza desde el catálogo de Facebook — no es independiente.
