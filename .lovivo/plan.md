# Patapete — Plan de Desarrollo

## Current State
Tienda de tapetes personalizados con IA. El configurador permite subir fotos de mascotas, generar retratos con IA (FLUX via Replicate), y previsualizar el resultado.

## Recent Changes
- **Zoom del preview +12%**: Todo el contenido del preview está envuelto en un div con `transform: scale(1.12)` para que el tapete llene más el frame.
- **Fuentes actualizadas**: phrase/phrase2: 5.5cqw/4.2cqw, name: 4.5cqw (fontWeight: 800)
- **Defaults en preview**: placeholders por defecto cuando los campos están vacíos
- **Color tinta = negro puro** `#000000`
- **phrase2 agregado**: Segunda frase inferior en el tapete
- **Nombre bajado levemente**: `translateY(calc(-100% + 14px))` para no encimarse con la frase superior

## NEXT: Preview nítido — White-to-transparent + no multiply blend

### Problema actual
`mixBlendMode: 'multiply'` en las imágenes de mascotas hace que los tonos medios (grises, colores claros) se fusionen con la textura del tapete → imagen se ve "lavada" y poco nítida. Para sublimación la imagen se imprime encima del tapete limpiamente, sin que la textura lo "coma".

### Solución
1. Crear función `removeWhiteBackground(url: string): Promise<string>` en `src/utils/imageUtils.ts`
   - Carga la imagen en un canvas HTML (off-screen)
   - Itera sobre todos los píxeles
   - Si R > 240 && G > 240 && B > 240 → alpha = 0 (transparente)
   - Retorna la imagen como data URL PNG transparente
   - No requiere ninguna librería, usa solo Canvas API nativa del browser
   - Es muy rápida (~50ms para imágenes de 800×800)

2. En `CanvasPreview.tsx`:
   - Crear estado por pet: `transparentUrls: Record<number, string>` (o un array por index)
   - useEffect: cuando cambia `pet.generatedArtUrl` O cuando es el demo URL, llamar a `removeWhiteBackground()` y guardar el resultado transparente
   - Mostrar la imagen transparente resultante
   - **Eliminar `mixBlendMode: 'multiply'`** en el `<img>` de mascotas — ya no hace falta
   - Para `isGenerated` y para el DEMO url, aplicar este tratamiento

3. En `canvasCompositing.ts` (usado por StepSummary para el dataUrl final):
   - En el paso de renderizado de pets con `isGenerated: true`, en lugar de `multiply` blend, hacer lo mismo: primero remover el fondo blanco de la imagen en canvas, luego dibujar con `globalCompositeOperation = 'source-over'` (normal)
   - Alternativamente: se puede pasar la URL ya transparente desde CanvasPreview al compositing

### Files to modify
- `src/utils/imageUtils.ts` (NUEVO): función `removeWhiteBackground(url)`
- `src/components/patapete/configurator/CanvasPreview.tsx`: 
  - Importar `removeWhiteBackground`
  - Estado `transparentUrls` (Record<number, string>)
  - useEffect que dispara `removeWhiteBackground` cuando cambia `generatedArtUrl` o cuando es DEMO
  - Mostrar `transparentUrls[i] || imgUrl` en lugar de solo `imgUrl`
  - Eliminar `mixBlendMode: 'multiply'` del `<img>` de mascotas
- `src/utils/canvasCompositing.ts`: 
  - Actualizar renderizado de pets `isGenerated` para usar normal blend en lugar de multiply (la imagen ya llega transparente o se puede procesar aquí también)

### Implementation details for removeWhiteBackground
```
async function removeWhiteBackground(imageUrl: string, threshold = 240): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < data.data.length; i += 4) {
        const r = data.data[i], g = data.data[i+1], b = data.data[i+2]
        if (r > threshold && g > threshold && b > threshold) {
          data.data[i+3] = 0 // transparent
        }
      }
      ctx.putImageData(data, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve(imageUrl) // fallback: return original
    img.src = imageUrl
  })
}
```

Note: For the ICONO style the threshold might need to be slightly lower (~230) to handle anti-aliasing. Could use a soft edge: pixels with R/G/B all > 240 → fully transparent, pixels 200-240 → proportionally reduce alpha.

### Optional enhancement: soft edge anti-aliasing
For cleaner edges (especially ICONO colorful style):
- Pixels where all channels > 240: alpha = 0
- Pixels where all channels > 200: alpha = proportional (0 to 255 based on distance from threshold)
- Otherwise: keep original alpha

## Architecture

### Frontend
- `src/components/patapete/configurator/CanvasPreview.tsx` — **CSS-based** preview (% positions + cqw text)
- `src/utils/canvasCompositing.ts` — Canvas compositing: still used for `onPreviewReady` dataUrl (StepSummary)
- `src/components/patapete/configurator/PhotoPetForm.tsx` — Upload form per pet (placeholder dinámico por índice)
- `src/components/patapete/configurator/types.ts` — Pet/Style types
- `src/utils/imageUtils.ts` — NEW: white background removal utility

### CSS Preview Layout (container-relative %)
Coordinates from Figma (2048×2048 frame), all in % of square container:

**Texts:**
- `texto-top` (phrase): top=34.71%, font-size=5.5cqw, weight=800
- `nombre-perro` (per pet): font-size=4.5cqw, weight=800, translateY(calc(-100% + 14px)) above each pet wrapper
- `texto-bottom` (phrase2): top=74%, font-size=4.2cqw, weight=800

**Zoom wrapper:** `transform: scale(1.12)` on inner div, outer container has `overflow-hidden`

**Pet positions:**
- 1 mascota: width=27.39%, left=36.32%, top=45.26%
- 2 mascotas: width=27.39%, top=45.26%, left=[18.06%, 52.29%]
- 3 mascotas: width=20.55%, top=49.21%, left=[15.28%, 39.30%, 63.81%]

### Backend (Edge Function)
- `supabase/functions/generate-tattoo/index.ts` — Replicate API (FLUX) + Claude Haiku para análisis
- Estilos: `dibujo` (blanco/negro, estilo sello/grabado) e `icono` (vector colorido plano)

## Known Issues / Notes
- El mockup del tapete es `TAPETE_URL` en `CanvasPreview.tsx` — imagen 2048×2048 en Supabase
- Demo pet: Border Terrier peekaboo vector (blanco bg → actualmente multiply blend, CAMBIAR a white-removal)
- Las fuentes Playfair Display y Plus Jakarta Sans están cargadas en index.css via Google Fonts
- `StepSummary.tsx` usaba `PRICES['tattoo']` (bug) → corregido a `PRICES['dibujo']`
- FLUX prompts especifican `PURE ABSOLUTE WHITE BACKGROUND (#FFFFFF)` → blanco limpio, ideal para white-key removal
- No se necesita cambiar el pipeline backend — la solución es 100% frontend