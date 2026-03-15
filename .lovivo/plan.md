# Patapete — Plan de Desarrollo

## Current State
Tienda de tapetes personalizados con IA. El configurador permite subir fotos de mascotas, generar retratos con IA (FLUX via Replicate), y previsualizar el resultado.

## Recent Changes
- **Defaults en preview**: Cuando los campos están vacíos, el preview muestra valores por defecto (no pre-rellena los inputs):
  - Texto superior default: "Aquí manda"
  - Texto inferior default: "No toques... ya sabemos que estás aquí"
  - Nombre mascota 1: "Max", 2: "Luna", 3: "Coco"
  - Los inputs usan `placeholder` con estos valores (no `value`)
- **Color tinta = negro puro** `#000000` (antes era marrón `#3d1f08`)
- **Todos los textos bold** (fontWeight: 700 en todos los elementos del preview)
- **phrase2 agregado**: Segunda frase (texto inferior, debajo de los perritos)
  - `types.ts`: `phrase2: string` en `ConfiguratorState`
  - `PatapeteConfigurator.tsx`: estado + handler `handlePhrase2Change`
  - `StepPets.tsx`: 2 inputs: "Texto superior" y "Texto inferior"
  - `CanvasPreview.tsx`: renderiza `phrase2` en `top: 74%` con Playfair italic
  - `StepSummary.tsx`: muestra phrase2 en resumen del pedido + lo guarda en localStorage
- **Fuentes reducidas** para evitar solapamiento entre frase y nombre:
  - `phrase`: 3.5cqw
  - `name`: 3.0cqw
  - `phrase2`: 3.5cqw

## Architecture

### Frontend
- `src/components/patapete/configurator/CanvasPreview.tsx` — **CSS-based** preview (% positions + cqw text)
- `src/utils/canvasCompositing.ts` — Canvas compositing: still used for `onPreviewReady` dataUrl (StepSummary)
- `src/components/patapete/configurator/PhotoPetForm.tsx` — Upload form per pet (placeholder dinámico por índice)
- `src/components/patapete/configurator/types.ts` — Pet/Style types

### CSS Preview Layout (container-relative %)
Coordinates from Figma (2048×2048 frame), all in % of square container:

**Texts:**
- `texto-top` (phrase): top=34.71%, font-size=3.5cqw
- `nombre-perro` (per pet): font-size=3.0cqw, positioned via `translateY(-100% - 4px)` above each pet wrapper
- `texto-bottom` (phrase2): top=74%, font-size=3.5cqw

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
- `StepSummary.tsx` usaba `PRICES['tattoo']` (bug) → corregido a `PRICES['dibujo']`