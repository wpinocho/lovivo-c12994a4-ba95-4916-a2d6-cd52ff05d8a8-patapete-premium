# Patapete — Plan

## Current State
Tienda de tapetes personalizados con mascotas. Pipeline de generación de arte en Supabase Edge Function.

## Pipeline de Generación (v19)
1. **Step 1** — rembg (`cjwbw/rembg` + `isnet-general-use`) sobre foto del usuario → PNG transparente
2. **Step 2** — Smart crop + normalize → canvas 800×800 blanco
3. **Step 2.5** — Upload a Supabase Storage → URL pública
4. **Step 3** — Claude Haiku 3 analiza foto → genera prompt optimizado
5. **Step 4** — FLUX 2 Pro + style reference → cartoon del tapete
6. **Step 5.5** — rembg (`cjwbw/rembg` + `isnet-general-use`) sobre output de FLUX → PNG transparente (preserva pelaje/pecho blanco)
7. **Step 6** — Upload PNG transparente a Storage permanente

## Cambio v18 → v19 (último commit)
- **Reemplazado**: `men1scus/birefnet` (version `f74986db...`) en Steps 1 y 5.5
- **Por**: `cjwbw/rembg` (version `fb8af171...`) con `model: isnet-general-use`
- **Razón**: BiRefNet tenía colas de GPU de 7–26s. rembg es CPU-based, ~1–2s total sin espera
- **Beneficio estimado**: ~25s ahorrados por generación (de ~45s total a ~20s)
- Una sola función `removeBackgroundRembg(image, stepLabel)` sirve para ambos pasos

## Frontend Architecture
- `CanvasPreview.tsx` — preview en tiempo real del tapete con la mascota
- `PhotoPetForm.tsx` — upload de foto + trigger de generación
- `canvasCompositing.ts` — composición sobre el tapete (salta removeWhiteBackground para URLs generadas)
- `replicateApi.ts` — llama a la edge function `generate-tattoo`

## Known Issues / Pending
- Fix pendiente: `CanvasPreview.tsx` puede estar reprocesando imágenes generadas (aplicando removeWhiteBackground a URLs que ya llegan limpias del servidor)
- Verificar que el preview muestre las mascotas generadas sin fusión de colores con el tapete beige