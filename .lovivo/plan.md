# Patapete — Plan de implementación

## Estado actual
- Ecommerce de tapetes personalizados (diseño a medida por cada cliente)
- Configurador: seleccionar mascota → personalizar diseño → preview aprobado antes de comprar → checkout
- Landing page + página de producto con FAQ existente

## Decisiones de diseño
- Tipografía del tapete: **toda Plus Jakarta Sans 800** (bold, sin itálica, sin serif)
  - Phrase superior, nombres, phrase inferior — misma fuente
  - Aplica tanto en CanvasPreview.tsx (preview visual) como en canvasCompositing.ts (JPG final)
- Flujo: Botón "⚡ Ordenar ahora" + "🛒 Agregar al carrito"
- StepSummary eliminado como paso navegable — contenido inline en el configurador

## Garantía (definida)
- Cubre: defectos físicos de fabricación/material
- NO cubre: cambios de diseño (cliente ya vio y aprobó el preview)
- Timeline real: producción 3-5 días hábiles, entrega 7-10 días totales

## FAQs
- Ambos archivos (landing + página de producto) actualizados y consistentes
- Pregunta clave: "¿El preview es el diseño real?" — diferenciador principal

## Archivos clave
- src/components/patapete/configurator/CanvasPreview.tsx — preview visual en configurador
- src/utils/canvasCompositing.ts — generación del JPG final para el pedido
- src/components/patapete/configurator/StepSummary.tsx — resumen antes de pagar
- src/components/patapete/ProductFAQ.tsx — FAQ página de producto
- src/components/patapete/PatapeteFAQ.tsx — FAQ landing page

---

## 🚨 ACTIVE PLAN: Customización Persistente + Imagen en Carrito

### Problema
1. **Arte FLUX expira**: URLs de Replicate CDN expiran en ~24h. Arte se pierde.
2. **Carrito muestra imagen genérica**: CartSidebar lee `product.images[0]`, no el preview personalizado.
3. **Backend no recibe la customización**: Checkout solo manda product_id+variant_id+quantity. No hay link entre la orden y el diseño del tapete.

### Arquitectura solución (Shopify-style)
```
USUARIO DISEÑA → DISEÑO GUARDADO EN DB → CARRITO REFERENCIA DISEÑO → ORDEN → LINK ORDEN↔DISEÑO
```

### Fase 1 — Arte permanente en Supabase Storage
- Modificar `supabase/functions/generate-tattoo/index.ts`
- Después de FLUX genera art URL → descargar → subir a `pet-tattoos/finals/${timestamp}.webp` → devolver URL permanente
- SUPABASE_URL y SERVICE_ROLE_KEY ya están configurados en la función

### Fase 2 — Imagen personalizada en carrito
- `PatapeteConfigurator.tsx`: al agregar al carrito, guardar `patapete_preview:${itemKey}` → preview_url en localStorage
- `CartSidebar.tsx`: leer `patapete_preview:${item.key}` de localStorage para mostrar imagen personalizada

### Fase 3 — DB de órdenes + Edge functions
**Tabla `patapete_orders`** en Supabase del usuario:
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
session_id text UNIQUE NOT NULL,
lovivo_order_id text,  -- se llena al hacer checkout
style text NOT NULL,  -- 'dibujo' | 'icono'
pet_count int NOT NULL,
pets jsonb NOT NULL,  -- [{name, art_url}]
phrase_top text,
phrase_bottom text,
preview_url text,  -- URL permanente en Storage
status text DEFAULT 'pending',
created_at timestamptz DEFAULT now()
```

**Edge function `save-patapete-order`**:
- Recibe: customization data + preview dataURL (base64)
- Sube preview a `patapete-previews/` bucket en Storage
- Guarda en `patapete_orders` tabla
- Devuelve: `{id, session_id, preview_url}`

**Edge function `link-patapete-order`**:
- Recibe: `{session_id, lovivo_order_id}`
- Actualiza `patapete_orders` con el order_id real

### Cart item key format
```js
// From CartContext (FORBIDDEN, don't modify):
const key = `${product.id}:${variant.id}`
// For patapete with 1 pet: key = `product_id:28fc993c-e638-459b-9a00-08abacdc9f32`
// For 2 pets: key = `product_id:1aee4582-040b-477a-b335-e99446fa76c7`
// For 3 pets: key = `product_id:5f7e007d-b30e-44c8-baa6-5aa03edb23ad`
```

### Archivos a modificar/crear
- `supabase/functions/generate-tattoo/index.ts` — agregar upload del arte final de FLUX a Storage
- `supabase/functions/save-patapete-order/index.ts` — NUEVO
- `supabase/functions/link-patapete-order/index.ts` — NUEVO
- `supabase/config.toml` — registrar nuevas funciones
- `src/components/patapete/configurator/PatapeteConfigurator.tsx` — llamar save-patapete-order, guardar en localStorage
- `src/components/CartSidebar.tsx` — mostrar imagen personalizada + llamar link-patapete-order

### Status: PENDIENTE DE APROBACIÓN