# Patapete — Plan

## Current State
Tienda de tapetes personalizados con mascotas. Pipeline de generación de arte en Supabase Edge Function.

## Pipeline de Generación (v20 — Fal.ai)
1. **Step 1** — `fal-ai/birefnet` (real BiRefNet, General Use Light, 1024x1024) sobre foto del usuario → PNG transparente
2. **Step 2** — Smart crop + normalize → canvas 800×800 blanco
3. **Step 2.5** — Upload a Supabase Storage → URL pública
4. **Step 3** — Claude Haiku 3 analiza foto → genera prompt optimizado
5. **Step 4** — `fal-ai/flux-2-pro/edit` + image_urls [petUrl, styleRefUrl] → cartoon del tapete
6. **Step 5.5** — `fal-ai/birefnet` sobre output de FLUX → PNG transparente
7. **Step 6** — Upload PNG transparente a Storage permanente

## Fal.ai REST API Pattern (Deno, sin SDK)
- **Submit**: `POST https://queue.fal.run/{endpoint}` con `Authorization: Key {FALAI_API_KEY}`
  - Body: input JSON
  - Response: `{ request_id, status_url, response_url, cancel_url, queue_position }`
- **Poll**: `GET {status_url}` → `{ status: "IN_QUEUE"|"IN_PROGRESS"|"COMPLETED" }`
- **Result**: `GET {response_url}` → model-specific output
- **BiRefNet output**: `{ image: { url: "https://..." } }`
- **FLUX 2 Pro edit output**: `{ images: [{ url: "https://..." }] }`

## Secrets configurados
- `FALAI_API_KEY` ✅ (ya en Supabase secrets)
- `ANTHROPIC_API_KEY` ✅
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` ✅
- `REPLICATE_API_KEY` — ya no se usa (v20)

## Frontend Architecture
- `CanvasPreview.tsx` — preview en tiempo real. Renderiza imágenes directamente sin ningún procesamiento de fondo (todos los assets llegan ya transparentes: demos en repo y generadas del servidor)
- `PhotoPetForm.tsx` — upload de foto + trigger de generación
- `canvasCompositing.ts` — composición sobre el tapete
- `replicateApi.ts` — llama a la edge function `generate-tattoo`

## Demo Images (public/demos/)
- `icono-0.webp` — mascota default 1 (fondo transparente)
- `icono-1.webp` — mascota default 2 (fondo transparente)
- `icono-2.webp` — mascota default 3 (fondo transparente)

## Notas de Prompts
- Haiku detecta explícitamente si ojos abiertos o cerrados en análisis
- Template incluye `MUST INCLUDE: eyes open or closed` en placeholder
- FLUX prompt usa `<image 1>` y `<image 2>` syntax (indexación explícita de Fal)
- Prompts evitan `solid black horizontal line` → usan `single thin black horizontal stroke line` + instrucciones negativas