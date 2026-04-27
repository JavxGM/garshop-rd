# GarShop.rd — Checklist del Admin

> Guía de todo lo que debes completar para tener la tienda lista para vender.

---

## 📦 Productos

### 1. Cargar el catálogo inicial
- [ ] Ir a `/admin/productos`
- [ ] Click en **"Cargar catálogo inicial"** para insertar los 15 productos base
- [ ] Verificar que los productos aparecen en la lista

### 2. Revisar y completar cada producto
Para cada producto, verificar que tenga:
- [ ] Nombre claro y descriptivo
- [ ] Precio de venta correcto en RD$
- [ ] Precio de compra (uso interno, nunca visible al cliente)
- [ ] Stock actualizado
- [ ] Categoría correcta (Micrófonos / Adaptadores / Cables / Audio / Accesorios / Otros)
- [ ] Descripción que explique el producto
- [ ] Estado **Activo** (los productos ocultos no aparecen en la tienda)

### 3. Subir fotos a cada producto
- [ ] Entrar al producto desde `/admin/productos`
- [ ] Click en **"Subir imagen"**
- [ ] Elegir foto desde el teléfono o computadora
- [ ] Usar **"Procesar con remove.bg"** para quitar el fondo automáticamente
- [ ] Marcar la mejor foto como **imagen principal**
- [ ] Repetir para todos los productos

> ⚠️ Sin fotos no hay ventas. Esta es la tarea más importante.

---

## 📋 Pedidos

### 4. Configurar tu flujo de gestión
- [ ] Ir a `/admin/pedidos`
- [ ] Cuando llegue un pedido nuevo, cambiar el estado a **Confirmado** al hablar con el cliente
- [ ] Cambiar a **Entregado** cuando el cliente reciba el producto
- [ ] Usar el botón de **WhatsApp** directo en cada pedido para contactar al cliente rápido

---

## 📱 Meta Business Manager

### 5. Mientras esperas la aprobación de Meta
- [ ] Entrar a [business.facebook.com](https://business.facebook.com)
- [ ] En la cuenta de Instagram @garshop.rd → hacer click en **"Log In"** para reautenticar
- [ ] Verificar que la página `garshop.rd` de Facebook esté activa y con info completa (foto de perfil, descripción, teléfono)

### 6. Cuando Meta apruebe el Request Review
- [ ] Activar **Facebook Shop** desde Commerce Manager
- [ ] Conectar el catálogo **"TODO"** al feed automático de la tienda
  - URL del feed: `https://garshop.rd/api/meta/catalog`
- [ ] Activar **Instagram Shopping** desde Business Manager
- [ ] Vincular número de **WhatsApp Business** al Business Portfolio
- [ ] Activar **Facebook Marketplace** desde el catálogo

---

## 📣 Publicación y Marketing

### 7. Instagram (@garshop.rd — 172 seguidores)
- [ ] Publicar cada producto como post con su foto y descripción
- [ ] Agregar el link de la tienda en la bio: `https://garshop.rd`
- [ ] Compartir links directos a productos en Stories
  - Cada link `/productos/[id]` ya muestra preview con foto, nombre y precio

### 8. WhatsApp
- [ ] Compartir el link de la tienda en grupos relevantes
- [ ] Enviar links directos de productos a clientes potenciales
  - Los links se ven así en WhatsApp: foto del producto + nombre + precio

### 9. Facebook Marketplace (cuando Meta apruebe)
- [ ] Verificar que los productos del catálogo se sincronizaron correctamente
- [ ] Revisar que cada producto tenga foto, precio y descripción antes de publicar

---

## 🔧 Mantenimiento continuo

### Cada semana
- [ ] Revisar el dashboard en `/admin` para ver pedidos pendientes
- [ ] Actualizar el stock de productos vendidos
- [ ] Revisar alertas de inventario (productos agotados o con poco stock)

### Cada mes
- [ ] Revisar el límite de remove.bg (50 imágenes gratis por mes)
  - Si se acaba, puedes subir imágenes sin procesar o esperar al próximo mes

---

## ✅ Estado actual

| Tarea | Estado |
|-------|--------|
| Tienda web funcionando | ✅ |
| OG Image para compartir links | ✅ |
| Preview por producto en WhatsApp | ✅ |
| Stock se descuenta automáticamente | ✅ |
| Carrito persiste al recargar | ✅ |
| Notificación Telegram por pedido | ✅ |
| Pipeline de remove.bg | ✅ |
| Fotos de productos subidas | ⬜ Pendiente |
| Facebook Shop activo | ⏳ Esperando revisión de Meta |
| Instagram Shopping activo | ⏳ Esperando revisión de Meta |
| Facebook Marketplace activo | ⏳ Esperando revisión de Meta |
| Feed automático a Meta | ⏳ En desarrollo |
