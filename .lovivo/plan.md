# Patapete — Plan de implementación

## Estado actual
El configurador visual (`PatapeteConfigurator`) está funcionando. El flujo completo incluye:
- Subida de foto de mascota → edge function `generate-tattoo` (BiRefNet + FLUX 2 Pro)
- Preview en canvas con textos y múltiples mascotas
- Guardado de customización en localStorage al agregar al carrito
- CartSidebar muestra imagen personalizada del tapete
- ThankYou limpia el localStorage al completar compra

## Cambios recientes
- **Demo images [0] reparadas** — Los URLs del bucket `message-images` para los slots `dibujo[0]` e `icono[0]` se rompieron (el bucket `message-images` no es permanente). Se generaron nuevas imágenes demo (Golden Retriever icono + dibujo) y se guardaron en el bucket permanente `product-images`. Actualizado en `CanvasPreview.tsx`.
- ⚠️ Los slots [1] y [2] también usan `message-images` — podrían romperse en el futuro. Migrar cuando sea posible.

## Arquitectura de customización

### Flujo al agregar al carrito:
1. `PatapeteConfigurator.saveCustomizationToCart()` guarda en localStorage:
   - Key: `patapete_customization:{productId}:{variantId}`
   - Value: `{ preview_dataurl, preview_image_url, customization_data }`
2. Edge function `upload-patapete-preview` sube canvas PNG a Storage (background, no-blocking)
3. `cartToApiItems` en `cart-utils.ts` lee localStorage y adjunta al checkout payload

### Datos que se envían al backend:
```json
{
  "customization_data": {
    "type": "patapete",
    "style": "dibujo|icono",
    "pet_count": 1|2|3,
    "pets": [{ "name": "...", "art_url": "..." }],
    "phrase_top": "...",
    "phrase_bottom": "...",
    "font": "Plus Jakarta Sans 800",
    "rug_size": "60x40cm",
    "material": "fibra de coco"
  },
  "preview_image_url": "https://..."
}
```

### Pendiente en el backend (Lovivo):
```sql
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS customization_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS preview_image_url TEXT DEFAULT NULL;
```

## Archivos clave
- `src/components/patapete/configurator/CanvasPreview.tsx` — Preview visual
- `src/components/patapete/configurator/PatapeteConfigurator.tsx` — Orquestador
- `src/components/patapete/configurator/StepPets.tsx` — UI del configurador
- `src/components/patapete/configurator/PhotoPetForm.tsx` — Upload + generación por mascota
- `src/components/CartSidebar.tsx` — Muestra imagen personalizada del tapete
- `src/lib/cart-utils.ts` — Adjunta customization_data al checkout payload
- `src/pages/ThankYou.tsx` — Limpia localStorage post-compra
- `supabase/functions/generate-tattoo/index.ts` — Pipeline: BiRefNet → smart crop → FLUX 2 Pro
- `supabase/functions/upload-patapete-preview/index.ts` — Sube canvas preview a Storage

## Variant IDs del producto
```
1 mascota: 28fc993c-e638-459b-9a00-08abacdc9f32
2 mascotas: 1aee4582-040b-477a-b335-e99446fa76c7
3 mascotas: 5f7e007d-b30e-44c8-baa6-5aa03edb23ad
```

## Imágenes demo (DEMO_URLS en CanvasPreview.tsx)
- `dibujo[0]`: product-images bucket — demo-dibujo-0.webp (Golden Retriever b&w) ✅ permanente
- `icono[0]`: product-images bucket — demo-icono-0.webp (Golden Retriever colorido) ✅ permanente
- `dibujo[1]`, `dibujo[2]`, `icono[1]`, `icono[2]`: message-images bucket ⚠️ puede expirar

## Notas técnicas
- `removeWhiteBackground()` en `imagePreprocessing.ts` procesa demos para quitar fondo blanco
- `compositeRug()` en `canvasCompositing.ts` genera el dataUrl para el carrito
- `styleRef` es un `useRef` para evitar stale closure en `handleGenerate`
- LocalStorage key format: `patapete_customization:{productId}:{variantId}`