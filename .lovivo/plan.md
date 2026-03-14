# Patapete — Plan de Desarrollo

## Current State
Tienda de tapetes personalizados con IA. El configurador permite subir fotos de mascotas, generar retratos con IA (FLUX via Replicate), y previsualizar el resultado en un canvas con mockup de tapete.

## Recent Changes
- **Demo image actualizada**: La imagen de placeholder en el previsualizador ahora usa el Border Terrier vector peekaboo (imagen de alta calidad subida por el usuario). URL: `https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773506866318-25g4wpclpbo.webp`
- **Renderizado demo mejorado**: Eliminado el estilo circular/opaco para demos. Ahora todas las imágenes (demo y generadas) usan el mismo blend peekaboo con multiply (fondo blanco desaparece sobre textura del tapete).
- **Canvas layout corregido** (sesión anterior): Slots de tamaño fijo (220/172/142px para 1/2/3 mascotas), ancla en Y_PAW=415, frase dentro del tapete en Y_PHRASE_BTM=474, nombres debajo de la frase.

## Architecture

### Frontend
- `src/components/patapete/configurator/CanvasPreview.tsx` — Preview canvas, DEMO_IMAGES, rendering logic
- `src/utils/canvasCompositing.ts` — Canvas compositing: slots, peekaboo layout, phrase/names
- `src/components/patapete/configurator/PhotoPetForm.tsx` — Upload form per pet
- `src/components/patapete/configurator/types.ts` — Pet/Style types

### Canvas Layout (600×600)
- Y_PAW = 415 (línea de patitas, borde superior del tapete)
- Y_CLIP = 438 (recorte del arte peekaboo, muestra ~23px de patitas)
- Y_PHRASE_BTM = 474 (frase dentro del tapete)
- PAW_RATIO = 0.76
- Tamaños: 1 mascota=220px, 2=172px, 3=142px

### Backend (Edge Function)
- `supabase/functions/generate-tattoo/index.ts` — Replicate API (FLUX) + Claude Haiku para análisis
- Estilos: `dibujo` (blanco/negro, estilo sello/grabado) e `icono` (vector colorido plano)

## Known Issues / Notes
- El mockup del tapete es `TAPETE_MOCKUP_URL` en `canvasCompositing.ts` — imagen 2048×2048 en Supabase
- El `isGenerated: true` se aplica siempre (incluso a demos) para que el multiply blend funcione correctamente con fondos blancos
- El badge "Ejemplo · Sube tu foto..." se controla vía `hasRealImage` que usa `pets.some(p => !!p.generatedArtUrl)`