# Patapete — Plan de Desarrollo

## Current State
Tienda de tapetes personalizados con IA. El configurador permite subir fotos de mascotas, generar retratos con IA (FLUX via Replicate), y previsualizar el resultado.

## Recent Changes
- **Previsualizador reescrito** (sesión actual): Reemplazado canvas approach por CSS puro + Container Queries
  - `CanvasPreview.tsx`: ahora usa HTML/CSS con posicionamiento en % (Figma-derived), cqw para textos, mix-blend-mode: multiply para imágenes
  - `index.css`: agregada clase `.tapete-preview` con `container-type: inline-size` para habilitar cqw
  - Eliminado badge "Ejemplo · Sube tu foto para ver tu mascota"
  - Canvas sigue corriendo en background solo para `onPreviewReady` (StepSummary)

## Architecture

### Frontend
- `src/components/patapete/configurator/CanvasPreview.tsx` — **CSS-based** preview (% positions + cqw text)
- `src/utils/canvasCompositing.ts` — Canvas compositing: still used for `onPreviewReady` dataUrl (StepSummary)
- `src/components/patapete/configurator/PhotoPetForm.tsx` — Upload form per pet
- `src/components/patapete/configurator/types.ts` — Pet/Style types

### CSS Preview Layout (container-relative %)
Coordinates from Figma (2048×2048 frame), all in % of square container:

**Texts:**
- `texto-top` (phrase): top=34.71%, font-size=5.76cqw
- `nombre-perro` (per pet): font-size=4.88cqw, positioned via `translateY(-100% - 3px)` above each pet wrapper

**Pet positions:**
- 1 mascota: width=27.39%, left=36.32%, top=45.26%
- 2 mascotas: width=27.39%, top=45.26%, left=[18.06%, 52.29%]
- 3 mascotas: width=20.55%, top=49.21%, left=[15.28%, 39.30%, 63.81%]

### Backend (Edge Function)
- `supabase/functions/generate-tattoo/index.ts` — Replicate API (FLUX) + Claude Haiku para análisis
- Estilos: `dibujo` (blanco/negro, estilo sello/grabado) e `icono` (vector colorido plano)

## Known Issues / Notes
- El mockup del tapete es `TAPETE_URL` en `CanvasPreview.tsx` — imagen 2048×2048 en Supabase
- Demo pet: Border Terrier peekaboo vector (blanco bg → multiply blend sobre rug texture)
- Las fuentes Playfair Display y Plus Jakarta Sans están cargadas en index.css via Google Fonts