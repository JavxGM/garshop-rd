@AGENTS.md

# GarShop.rd — Tienda de Electrónicos Online

## Resumen del proyecto
Tienda online de electrónicos para el mercado dominicano: micrófonos, adaptadores, cables, audio y accesorios tech. Mismo modelo de negocio que GainRD: tráfico desde Instagram, checkout por WhatsApp (sin pasarela de pago), precios en RD$, entrega manual.

**Repositorio:** github.com/JavxGM/garshop-rd

---

## Stack técnico
- **Framework:** Next.js 15+ (App Router) + TypeScript
- **Estilos:** Tailwind CSS v4 (CSS-first, `@import "tailwindcss"` en globals.css)
- **Base de datos:** Supabase (mismo proyecto que GainRD — tablas con prefijo `garshop_`)
- **Deploy:** Vercel (auto-deploy desde GitHub)
- **Iconos:** lucide-react
- **Auth admin:** sessionStorage + contraseña en env var

---

## Variables de entorno
```
NEXT_PUBLIC_SUPABASE_URL=            # mismo que GainRD
NEXT_PUBLIC_SUPABASE_ANON_KEY=       # mismo que GainRD
NEXT_PUBLIC_GARSHOP_WHATSAPP_NUMBER= # número sin + ni espacios
NEXT_PUBLIC_ADMIN_PASSWORD=garshop2024
```

---

## Estructura de archivos
```
app/
├── page.tsx                    # Tienda pública (hero + categorías + productos)
├── layout.tsx                  # Layout raíz con CartContext
├── globals.css                 # Tailwind v4 CSS (tema tech-forward: cyan)
└── admin/
    ├── layout.tsx              # Layout admin (sidebar + AuthGuard)
    ├── page.tsx                # Dashboard con estadísticas
    ├── productos/page.tsx      # Lista productos (server)
    └── pedidos/page.tsx        # Lista pedidos (server)
app/api/
└── admin/seed/route.ts         # POST: carga catálogo de productos
components/
├── Navbar.tsx
├── ProductCard.tsx
├── CartDrawer.tsx              # Drawer carrito → formulario → WhatsApp
└── admin/
    ├── AdminAuthGuard.tsx      # Gate de contraseña con sessionStorage
    ├── AdminSidebar.tsx
    ├── ProductosAdmin.tsx      # CRUD productos + botón "Cargar catálogo"
    └── PedidosAdmin.tsx        # Lista pedidos, filtros, cambio de estado
context/
└── CartContext.tsx             # Estado global del carrito
lib/
├── types.ts                    # Tipos: Producto, Pedido, ItemCarrito, Categoria
├── supabase.ts                 # Cliente Supabase con fallback placeholders
├── whatsapp.ts                 # Genera URL wa.me con mensaje formateado
└── catalogo.ts                 # 13 productos electrónicos reales con precios RD$
supabase/
└── schema.sql                  # Tablas garshop_productos y garshop_pedidos con RLS
```

---

## Base de datos (Supabase)
Tablas con prefijo `garshop_` para coexistir con GainRD en el mismo proyecto Supabase.

### Tabla `garshop_productos`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK auto |
| nombre | TEXT | |
| descripcion | TEXT | |
| precio | NUMERIC(10,2) | ≥ 0 |
| stock | INTEGER | ≥ 0 |
| imagen_url | TEXT | nullable |
| categoria | TEXT | microfono / adaptador / cable / audio / accesorios / otro |
| activo | BOOLEAN | default true |
| created_at | TIMESTAMPTZ | |

### Tabla `garshop_pedidos`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK auto |
| cliente_nombre | TEXT | |
| cliente_telefono | TEXT | |
| cliente_direccion | TEXT | |
| items | JSONB | array de ItemCarrito |
| total | NUMERIC(10,2) | |
| estado | TEXT | pendiente / confirmado / entregado / cancelado |
| notas | TEXT | nullable |
| created_at | TIMESTAMPTZ | |

### RLS Policies
- `garshop_productos`: lectura pública solo activos, admin todo
- `garshop_pedidos`: inserción pública, admin todo

---

## Flujo de compra (cliente)
1. Entra a la tienda
2. Ve productos por categoría, añade al carrito
3. Abre drawer → llena nombre, teléfono, dirección
4. Click "Enviar pedido por WhatsApp"
5. Se guarda en Supabase y abre WhatsApp con mensaje formateado
6. Dueño recibe el mensaje y confirma manualmente

---

## Panel admin (`/admin`)
- **Contraseña:** `garshop2024` (cambiar en Vercel → `NEXT_PUBLIC_ADMIN_PASSWORD`)
- **sessionStorage key:** `garshop_admin` (separado de GainRD que usa `gainrd_admin`)
- **Dashboard:** stats de productos activos, pedidos pendientes, sin stock, ventas totales
- **Productos:** CRUD completo + toggle activo/oculto + botón "Cargar catálogo"
- **Pedidos:** lista con expand, filtros por estado, cambio de estado, link WhatsApp al cliente

---

## Notas técnicas
- Todas las páginas con Supabase tienen `export const dynamic = "force-dynamic"`
- El cliente Supabase usa placeholders para que el build no falle sin env vars
- El admin usa contraseña simple en `sessionStorage` (no Supabase Auth)
- Tailwind v4: config CSS-first en `globals.css`, sin `tailwind.config.js`
- ESLint 9 con flat config (`eslint.config.mjs`)
- Estética: dark navy-blue (#0a0f1a) + cyan (#06b6d4) — tech-forward, diferente al gym-bold naranja de GainRD
- Mismo Supabase project que GainRD: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` son iguales
