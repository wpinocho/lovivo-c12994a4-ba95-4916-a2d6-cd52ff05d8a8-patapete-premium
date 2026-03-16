# Patapete — Plan del Proyecto

## Estado General
Tienda de tapetes personalizados con mascotas. El configurador interactivo (`PatapeteConfigurator`) genera retratos de mascotas con IA (FLUX) y los compone sobre un mockup de tapete.

## Arquitectura de Almacenamiento
- Assets estáticos en `public/` del repo (mismo origen, sin CORS, sin expiración)
- Imágenes demo: `public/demos/icono-0.webp`, `icono-1.webp`, `icono-2.webp`
- Tapete mockup: `public/tapete-mockup.webp`

## Estado del Estilo
- **Estilo activo: `icono`** — siempre forzado en estado inicial y tras cargar localStorage
- Estilo `dibujo` oculto hasta tener sus imágenes demo

## Cambios Recientes
- Bug fix: estilo `icono` ahora se fuerza correctamente incluso al cargar desde localStorage
- Prompt de Haiku para `icono` actualizado con extracción detallada (expresión, textura pelo, colores, rasgos críticos)
- **PhotoPetForm rediseñado** — layout horizontal compacto: thumbnail 88×88px a la izquierda, instrucciones/nombre a la derecha. Mucho más limpio y proporcional al preview del tapete.

## Archivos Clave
- `src/components/patapete/configurator/PatapeteConfigurator.tsx` — orquestador principal
- `src/components/patapete/configurator/PhotoPetForm.tsx` — form de foto por mascota (compact redesign)
- `src/components/patapete/configurator/CanvasPreview.tsx` — preview del tapete en CSS
- `src/utils/canvasCompositing.ts` — composición canvas para finalPreviewDataUrl
- `src/utils/imagePreprocessing.ts` — removeWhiteBackground + compressAndResizeImage
- `src/utils/replicateApi.ts` — llamadas a Replicate (BiRefNet + FLUX)
- `supabase/functions/generate-tattoo/index.ts` — edge function: analiza foto con Haiku → genera prompt → llama FLUX