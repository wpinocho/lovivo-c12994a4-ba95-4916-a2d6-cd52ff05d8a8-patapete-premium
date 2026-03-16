# Patapete — Plan

## Current State
Tienda de tapetes personalizados con mascotas. Pipeline de generación de arte en Supabase Edge Function.

## Pipeline de Generación (v19)
1. **Step 1** — rembg (`cjwbw/rembg` + `isnet-general-use`) sobre foto del usuario → PNG transparente
2. **Step 2** — Smart crop + normalize → canvas 800×800 blanco
3. **Step 2.5** — Upload a Supabase Storage → URL pública
4. **Step 3** — Claude Haiku 3 analiza foto → genera prompt optimizado
5. **Step 4** — FLUX 2 Pro + style reference → cartoon del tapete
6. **Step 5.5** — rembg (`cjwbw/rembg` + `isnet-general-use`) sobre output de FLUX → PNG transparente
7. **Step 6** — Upload PNG transparente a Storage permanente

## Frontend Architecture
- `CanvasPreview.tsx` — preview en tiempo real. Renderiza imágenes directamente sin ningún procesamiento de fondo (todos los assets llegan ya transparentes: demos en repo y generadas del servidor)
- `PhotoPetForm.tsx` — upload de foto + trigger de generación
- `canvasCompositing.ts` — composición sobre el tapete
- `replicateApi.ts` — llama a la edge function `generate-tattoo`

## Demo Images (public/demos/)
- `icono-0.webp` — mascota default 1 (fondo transparente, proporcionadas por usuario)
- `icono-1.webp` — mascota default 2 (fondo transparente, proporcionadas por usuario)
- `icono-2.webp` — mascota default 3 (fondo transparente, proporcionadas por usuario)
- Usados para estilos `icono` y `dibujo` como placeholder

## Simplificaciones recientes
- **Eliminado**: toda la lógica de `removeWhiteBackground` en `CanvasPreview.tsx`
- **Eliminado**: estado `transparentUrls` y `processingRef`
- **Eliminado**: distinción generated vs demo images para procesamiento
- Las imágenes se renderizan directamente — sin delays, sin flash de fondo blanco
- Demos actualizados con imágenes reales transparentes del usuario

## Prompt Fix (icono + dibujo)
- **Problema**: FLUX interpretaba `solid black horizontal line` como un bloque/panel negro relleno abajo del perro → rembg no podía quitarlo bien
- **Fix aplicado**: cambiado a `single thin black horizontal stroke line` + instrucción explícita `NO filled black panel, NO solid block below the line` en ambos prompts (icono y dibujo)