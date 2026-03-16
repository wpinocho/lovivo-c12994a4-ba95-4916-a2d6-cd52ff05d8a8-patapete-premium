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

## ✅ COMPLETADO: Customización Persistente + Imagen en Carrito + Backend

### Qué se implementó

**Fase 1 — URLs permanentes (generate-tattoo/index.ts)**
- Step 5 agregado: descarga el webp de Replicate → sube a `pet-tattoos/finals/${timestamp}.webp`
- Edge function ahora devuelve URL permanente de Supabase Storage (nunca expira)
- Función `uploadFinalArt()` añadida antes del handler principal

**Fase 2 — Preview personalizado en carrito**
- `supabase/functions/upload-patapete-preview/index.ts` — nueva edge function que recibe base64 PNG del canvas y sube a `pet-tattoos/previews/`
- `supabase/config.toml` — registrado `[functions.upload-patapete-preview]`
- `PatapeteConfigurator.tsx` — helper `saveCustomizationToCart()` que:
  1. Guarda `customization_data` + `preview_dataurl` en localStorage inmediatamente
  2. Sube el preview a Storage async (non-blocking) y actualiza `preview_image_url` cuando termina
  - Clave localStorage: `patapete_customization:${productId}:${variantId}` (mismo formato que CartContext)
- `CartSidebar.tsx` — función `getProductItemImage()` que lee localStorage para mostrar el tapete personalizado

**Fase 3 — Customización al checkout**
- `src/lib/supabase.ts` — `CheckoutItem` extendido con `customization_data?` y `preview_image_url?`
- `src/lib/cart-utils.ts` — `cartToApiItems()` lee localStorage por item key y adjunta ambos campos al payload

**Fase 4 — Cleanup localStorage**
- `src/pages/ThankYou.tsx` — limpia todas las entradas `patapete_customization:*` tras completar la compra

### Pendiente (coordinación con admin Lovivo)
```sql
-- Aplicar en el backend de Lovivo para persistir la customización en órdenes:
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS customization_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS preview_image_url TEXT DEFAULT NULL;
```
El storefront ya envía estos campos en el payload de `checkout-create`. El backend los guardará cuando se aplique la migración.