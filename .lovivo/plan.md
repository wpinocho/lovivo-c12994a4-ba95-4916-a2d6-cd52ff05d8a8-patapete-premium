# Patapete — Plan

## Current State
Tienda de tapetes personalizados con mascotas. Pipeline de generación de arte en Supabase Edge Function.

## Pipeline de Generación (v21 — Fal.ai, sin BiRefNet en FLUX output)
1. **Step 1** — `fal-ai/birefnet` (real BiRefNet, General Use Light, 1024x1024) sobre foto del usuario → PNG transparente
2. **Step 2** — Smart crop + normalize → canvas 800×800 blanco
3. **Step 2.5** — Upload a Supabase Storage → URL pública
4. **Step 3** — Claude Haiku 3 analiza foto → genera prompt optimizado
5. **Step 4** — `fal-ai/flux-2-pro/edit` + image_urls [petUrl, styleRefUrl] → cartoon del tapete (JPEG)
6. **Step 5.5 ELIMINADO** — BiRefNet sobre output de FLUX causaba que removiera el pecho blanco del perro (no distingue fondo de áreas blancas interiores)
7. **Step 6** — Upload FLUX JPEG a Storage permanente → `finals/{timestamp}.jpg`

## Background Removal Strategy
- **Server-side (Step 1)**: BiRefNet solo sobre la FOTO DEL USUARIO → perfecto para separar mascota de fondo
- **Client-side (CanvasPreview + canvasCompositing)**: `removeBackgroundFloodFill` — BFS desde las 4 esquinas, solo remueve píxeles near-white CONECTADOS al borde exterior. Preserva áreas blancas interiores (pecho, ojos, etc.)
- ❌ NUNCA correr BiRefNet sobre el output de FLUX (remueve áreas blancas del dibujo)

## Flood Fill Algorithm (`removeBackgroundFloodFill` en imagePreprocessing.ts)
- Threshold: 240 (min(R,G,B) ≥ 240)
- Queue: `Int32Array` con head-pointer para O(1) dequeue
- Siembra BFS desde todos los píxeles del borde
- Solo remueve píxeles conectados al exterior → interior white islands preserved
- Demo images (transparent webp) pasan directo sin procesar

## Fal.ai REST API Pattern (Deno, sin SDK)
- **Submit**: `POST https://queue.fal.run/{endpoint}` con `Authorization: Key {FALAI_API_KEY}`
- **Poll**: `GET {status_url}` → `{ status: "IN_QUEUE"|"IN_PROGRESS"|"COMPLETED" }`
- **Result**: `GET {response_url}` → model-specific output
- **BiRefNet output**: `{ image: { url: "https://..." } }`
- **FLUX 2 Pro edit output**: `{ images: [{ url: "https://..." }] }`

## Secrets configurados
- `FALAI_API_KEY` ✅
- `ANTHROPIC_API_KEY` ✅
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` ✅
- `REPLICATE_API_KEY` — ya no se usa

## Frontend Architecture
- `CanvasPreview.tsx` — preview HTML/CSS en tiempo real. Usa `processedUrls` state (flood fill aplicado en useEffect). Demo images directo, generated images procesadas. Llama `compositeRug(petData, phrase, phrase2)` para generar el cart thumbnail.
- `PhotoPetForm.tsx` — upload de foto + trigger de generación
- `canvasCompositing.ts` — genera el cart thumbnail (600×600 canvas) que **replica exactamente** el layout CSS de CanvasPreview: scale(1.12) desde center, top phrase 34.71%, pets en layout por %, nombres sobre mascotas, phrase2 70%. Usa `removeBackgroundFloodFill` para isGenerated/isDemo.
- `replicateApi.ts` — llama a la edge function `generate-tattoo`

## Cart Preview Flow
1. `CanvasPreview` → `compositeRug(pets, phrase, phrase2)` → `onPreviewReady(dataUrl)`
2. `PatapeteConfigurator` → `finalPreviewRef.current = dataUrl`
3. Al "Agregar al carrito" → `saveCustomizationToCart` → `localStorage.setItem(patapete_customization:${itemKey}, { preview_dataurl: dataUrl })`
4. Upload async a Supabase Storage → `preview_image_url`
5. `CartSidebar.getProductItemImage` → lee `preview_image_url || preview_dataurl` → muestra el tapete compuesto correcto

## Demo Images (public/demos/)
- `icono-0.webp` — mascota default 1 (fondo transparente, no necesita procesamiento)
- `icono-1.webp` — mascota default 2 (fondo transparente)
- `icono-2.webp` — mascota default 3 (fondo transparente)

## Notas de Prompts
- Haiku detecta explícitamente si ojos abiertos o cerrados en análisis
- Template incluye `MUST INCLUDE: eyes open or closed` en placeholder
- FLUX prompt usa `<image 1>` y `<image 2>` syntax (indexación explícita de Fal)
- Prompts evitan `solid black horizontal line` → usan `single thin black horizontal stroke line` + instrucciones negativas