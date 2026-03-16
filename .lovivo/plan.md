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

## 🚨 ACTIVE PLAN: Customización Persistente + Imagen en Carrito + Backend

### Arquitectura aprobada (Lovivo Native)

```
USUARIO DISEÑA → ARTE FLUX GUARDADO EN STORAGE (permanente)
                        │
                        ▼
              USUARIO AGREGA AL CARRITO
                        │
                        ▼
     Preview dataURL → Storage (async, background upload)
     customization_data JSON → localStorage (inmediato)
     item.key → link entre carrito y customización
                        │
                        ▼
              CART SIDEBAR lee localStorage
              Muestra preview personalizado ✅
                        │
                        ▼
              CHECKOUT CREATION (cartToApiItems)
              Lee localStorage → adjunta customization_data + preview_image_url
              al payload de checkout-create
                        │
                        ▼
         LOVIVO BACKEND (checkout-create) guarda en order_items:
         - customization_data (JSONB) — receta de fabricación completa
         - preview_image_url (TEXT) — imagen del tapete final
                        │
                        ▼
         DASHBOARD ADMIN ve la orden con preview + specs ✅
```

### Schema change (Lovivo backend — coordinado con admin)
```sql
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS customization_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS preview_image_url TEXT DEFAULT NULL;
```
**IMPORTANTE:** El usuario (dueño de Lovivo) aplicará este cambio en su backend. El storefront envía estos campos y el backend los guarda si existen.

### customization_data para Patapete (estructura exacta)
```json
{
  "type": "patapete",
  "style": "dibujo",
  "pet_count": 2,
  "pets": [
    { "name": "Max", "art_url": "https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/pet-tattoos/finals/1234.webp" },
    { "name": "Luna", "art_url": "https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/pet-tattoos/finals/5678.webp" }
  ],
  "phrase_top": "Aquí manda",
  "phrase_bottom": "No toques... ya sabemos que estás aquí",
  "font": "Plus Jakarta Sans 800",
  "rug_size": "60x40cm",
  "material": "fibra de coco"
}
```

---

## Fase 1 — Arte FLUX permanente en Storage

**Problema:** FLUX 2 Pro devuelve URLs de Replicate CDN que expiran en ~24h.
**Solución:** En `generate-tattoo/index.ts`, después de Step 4 (FLUX output), agregar Step 5: descargar el webp de Replicate → subirlo a `pet-tattoos/finals/${Date.now()}.webp` → devolver URL permanente de Storage.

### Archivo a modificar: `supabase/functions/generate-tattoo/index.ts`

Agregar función `uploadFinalArt(artUrl: string): Promise<string>`:
```typescript
async function uploadFinalArt(artUrl: string): Promise<string> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const res = await fetch(artUrl)
  if (!res.ok) throw new Error(`Failed to download FLUX art: ${res.status}`)
  const bytes = new Uint8Array(await res.arrayBuffer())
  const filename = `finals/${Date.now()}.webp`

  const { error } = await supabase.storage
    .from('pet-tattoos')
    .upload(filename, bytes, { contentType: 'image/webp', upsert: false })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)
  const { data } = supabase.storage.from('pet-tattoos').getPublicUrl(filename)
  return data.publicUrl
}
```

En el main handler, después de `const artUrl = await generateWithFlux2Pro(...)`:
```typescript
// Step 5: Upload FLUX result to permanent Storage
console.log('[generate-tattoo] ─── Step 5: Upload FLUX art to permanent Storage ───')
const t5 = Date.now()
const permanentArtUrl = await uploadFinalArt(artUrl)
console.log(`[generate-tattoo] Step 5 done in ${Date.now() - t5}ms | permanent URL: ${permanentArtUrl}`)

return new Response(JSON.stringify({ url: permanentArtUrl }), { ... })
```

---

## Fase 2 — Preview personalizado en carrito

### 2a. Edge function para upload del preview: `supabase/functions/upload-patapete-preview/index.ts` (NUEVO)

```typescript
// Recibe: { base64: string } — dataURL del canvas del tapete completo
// Sube a: pet-tattoos/previews/${timestamp}.png
// Devuelve: { url: string }
```

Necesita CORS headers + SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (ya disponibles en el proyecto).
Registrar en `supabase/config.toml` bajo [functions.upload-patapete-preview].

### 2b. PatapeteConfigurator.tsx — guardar customización al agregar al carrito

En `handleAddToCart` y `handleOrderNow`, ANTES de llamar `addItem`:

```typescript
// 1. Calcular item key (igual que CartContext)
const itemKey = `${product.id}:${variantId}`

// 2. Guardar inmediatamente en localStorage con dataUrl para display rápido en carrito
const customizationData = {
  type: 'patapete',
  style: currentState.style,
  pet_count: currentState.petCount,
  pets: currentState.pets.slice(0, currentState.petCount).map(p => ({
    name: p.name || 'Mascota',
    art_url: p.generatedArtUrl || null,
  })),
  phrase_top: currentState.phrase,
  phrase_bottom: currentState.phrase2,
  font: 'Plus Jakarta Sans 800',
  rug_size: '60x40cm',
  material: 'fibra de coco',
}
const tempEntry = {
  preview_dataurl: finalPreviewRef.current,  // usar para mostrar en carrito inmediatamente
  preview_image_url: null,                   // se llenará cuando termine el upload async
  customization_data: customizationData,
}
localStorage.setItem(`patapete_customization:${itemKey}`, JSON.stringify(tempEntry))

// 3. Upload async en background (no bloquea el carrito)
if (finalPreviewRef.current) {
  const base64 = finalPreviewRef.current.split(',')[1] // quitar "data:image/png;base64,"
  supabase.functions.invoke('upload-patapete-preview', { body: { base64 } })
    .then(({ data }) => {
      if (data?.url) {
        const existing = JSON.parse(localStorage.getItem(`patapete_customization:${itemKey}`) || '{}')
        existing.preview_image_url = data.url
        localStorage.setItem(`patapete_customization:${itemKey}`, JSON.stringify(existing))
      }
    })
    .catch(console.error)
}

// 4. Continuar con flujo normal
addItem(product, variant)
```

Necesita importar: `import { supabase } from '@/integrations/supabase/client'`

### 2c. CartSidebar.tsx — mostrar imagen personalizada

En la sección de render de product items (actualmente lee `item.product.images?.[0]`), agregar lógica:

```typescript
// Al inicio del componente o dentro del map:
const getItemImage = (item: CartProductItem): string | undefined => {
  try {
    const stored = localStorage.getItem(`patapete_customization:${item.key}`)
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.preview_dataurl || parsed.preview_image_url || item.product.images?.[0]
    }
  } catch {}
  return item.product.images?.[0]
}
```

Usar `getItemImage(item as CartProductItem)` en lugar de `item.product.images?.[0]` para product items.

---

## Fase 3 — Pasar customización al checkout

### src/lib/supabase.ts — Extender CheckoutItem

```typescript
export interface CheckoutItem {
  product_id: string
  quantity: number
  variant_id?: string
  selling_plan_id?: string
  customization_data?: Record<string, any>  // NUEVO
  preview_image_url?: string                 // NUEVO
}
```

### src/lib/cart-utils.ts — Adjuntar customización en cartToApiItems

En el bloque `type === 'product'` (actualmente solo envía product_id, quantity, variant_id, selling_plan_id):

```typescript
// Leer customización de localStorage
let customizationFields: { customization_data?: any; preview_image_url?: string } = {}
try {
  const stored = localStorage.getItem(`patapete_customization:${product.id}:${variant?.id || ''}`)
  if (stored) {
    const parsed = JSON.parse(stored)
    if (parsed.customization_data) customizationFields.customization_data = parsed.customization_data
    if (parsed.preview_image_url) customizationFields.preview_image_url = parsed.preview_image_url
  }
} catch {}

map.set(key, {
  product_id: product.id,
  quantity: item.quantity,
  ...(variant && { variant_id: variant.id }),
  ...(sellingPlan && { selling_plan_id: sellingPlan.id }),
  ...customizationFields,  // NUEVO
})
```

**NOTA:** `cartToApiItems` también es llamado desde `CartSidebar.tsx` (handleCreateCheckout usa `useCheckout` → `checkout()` → `cartToApiItems`). El key en localStorage usa el mismo formato que CartContext: `${product.id}:${variant.id}`.

---

## Fase 4 — Cleanup localStorage

Al cargar la página ThankYou o cuando el checkout se completa, limpiar las entradas de `patapete_customization:*` del localStorage para no acumular datos viejos.

En `src/pages/ThankYou.tsx` (o donde se confirme el pago):
```typescript
// Clean up patapete customization data after successful order
Object.keys(localStorage)
  .filter(k => k.startsWith('patapete_customization:'))
  .forEach(k => localStorage.removeItem(k))
```

---

## Resumen de archivos a modificar/crear

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/generate-tattoo/index.ts` | Agregar Step 5: upload FLUX result a Storage (permanente) |
| `supabase/functions/upload-patapete-preview/index.ts` | NUEVO: edge function para subir preview canvas |
| `supabase/config.toml` | Registrar upload-patapete-preview |
| `src/lib/supabase.ts` | Agregar `customization_data?` y `preview_image_url?` a CheckoutItem |
| `src/lib/cart-utils.ts` | Leer localStorage y adjuntar customization fields a checkout items |
| `src/components/CartSidebar.tsx` | Mostrar preview personalizado del tapete |
| `src/components/patapete/configurator/PatapeteConfigurator.tsx` | Guardar customización en localStorage + upload async al carrito |
| `src/pages/ThankYou.tsx` | Cleanup localStorage al completar orden |

## Estado: APROBADO — LISTO PARA IMPLEMENTAR EN CRAFT MODE

### Orden de implementación recomendado:
1. Fase 1: generate-tattoo Step 5 (URLs permanentes — crítico)
2. Fase 2: upload-patapete-preview edge function + PatapeteConfigurator + CartSidebar
3. Fase 3: supabase.ts + cart-utils (pasar data al backend)
4. Fase 4: ThankYou cleanup