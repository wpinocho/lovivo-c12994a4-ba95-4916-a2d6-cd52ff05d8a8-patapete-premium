# Patapete — Plan de implementación

## Estado actual
El configurador visual (`PatapeteConfigurator`) está funcionando. El flujo completo incluye:
- Subida de foto de mascota → edge function `generate-tattoo` (BiRefNet + FLUX 2 Pro)
- Preview en canvas con textos y múltiples mascotas
- Guardado de customización en localStorage al agregar al carrito
- CartSidebar muestra imagen personalizada del tapete
- ThankYou limpia el localStorage al completar compra

## Arquitectura de Storage (2 Supabase)

### Supabase de Lovivo (`ptgmltivisbtvmoxwnhd`) — NO manipulable directamente
- Bucket `product-images`: imágenes de productos (permanente)
- Bucket `message-images`: **TEMPORAL/inestable — URLs expiran ⚠️**
- `lov-copy` / `image--optimize` guardan aquí con `also_in_repo: True`
- Las style references del pipeline FLUX apuntan aquí (OK, son permanentes)

### Supabase del usuario (`vqmqdhsajdldsraxsqba`) — controlable via supabase_* tools
- Bucket `pet-tattoos`: fotos procesadas de mascotas de usuarios
  - `temp/`: fotos normalizadas temporales (BiRefNet output)
  - `finals/`: arte FLUX final permanente
- Las edge functions `generate-tattoo` y `upload-patapete-preview` corren aquí

### Repo `public/` — MEJOR opción para assets estáticos
- Mismo origen que la app → CERO problemas de CORS en canvas
- Nunca expiran, siempre disponibles
- `/tapete-mockup.webp` — fondo del tapete ✅ guardado
- `/demos/icono-0.webp` — terrier con paliacate ✅ guardado
- `/demos/icono-1.webp` — chihuahua ✅ guardado
- `/demos/icono-2.webp` — bulldog francés ✅ guardado
- `/demos/dibujo-0.webp` — ⏳ PENDIENTE (user enviará imágenes)
- `/demos/dibujo-1.webp` — ⏳ PENDIENTE
- `/demos/dibujo-2.webp` — ⏳ PENDIENTE

## Cambios recientes
- **Arquitectura de demos corregida** — Todas las imágenes demo e imagen del tapete migradas al repo `public/` para evitar CORS y URLs que expiran
- `CanvasPreview.tsx` y `canvasCompositing.ts` actualizados para usar paths `/demos/icono-X.webp` y `/tapete-mockup.webp`
- Dibujo usa icono como placeholder temporal hasta recibir imágenes del usuario

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
- `src/utils/canvasCompositing.ts` — Composición del canvas (también usa /tapete-mockup.webp)
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