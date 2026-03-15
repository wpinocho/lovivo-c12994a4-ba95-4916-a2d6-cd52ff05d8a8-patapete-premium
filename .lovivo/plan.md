# Patapete — Plan de Desarrollo

## Estado Actual
Tienda de tapetes personalizados con mascotas. El configurador tiene:
- **PhotoPetForm.tsx** — form principal con upload de foto y personalización de texto
- **CanvasPreview.tsx** — preview en tiempo real con HTML + CSS
- **canvasCompositing.ts** — export final en canvas (StepSummary)
- **generate-tattoo/index.ts** — Edge Function: pipeline de 4 pasos (BiRefNet → normalize → Claude Haiku → FLUX 2 Pro)

## Cambios Recientes

### Renderizado de mascotas: sin multiply, fondo blanco removido en browser
- **`imagePreprocessing.ts`**: nueva función `removeWhiteBackground(url, threshold=238, fadeZone=25)` — remueve píxeles blancos/casi-blancos vía canvas pixel manipulation, sin backend. Preserva todo el fur/colores (min channel < 213 = opaco, >238 = transparente, fade suave en el medio).
- **`CanvasPreview.tsx`**: 
  - Cache de URLs procesadas en `transparentUrls` state + `processingRef` para no re-procesar
  - Procesa cada URL de mascota (demo o generada) con `removeWhiteBackground` 
  - Usa `transparentUrls[imgUrl] || imgUrl` como src del `<img>`
  - **Eliminado** `mixBlendMode: 'multiply'` del elemento img
- **`canvasCompositing.ts`**:
  - Importa `removeWhiteBackground`
  - Para `isGenerated` y `isDemo`: procesa URL antes de dibujar, sin multiply blend
  - Resultado: simula sublimación real — imagen nítida encima del tapete

### Por qué este approach:
- Las imágenes de FLUX ya tienen fondo `#FFFFFF` puro → fácil de remover
- El demo Border Terrier también tiene fondo blanco
- `multiply` fusionaba los medios tonos con la textura del yute → imagen borrosa
- PNG transparente compositeado encima = se ve como sublimación real (impresa sobre el tapete)

## Preferencias del Usuario
- Textos en negro puro `#000000`, fontWeight 800
- Tapete es el protagonista, sin cortes en su diseño
- Preview escalado al 112% para llenar el frame
- El preview debe simular bien la sublimación (imagen nítida, no absorbida por textura)

## Textos Default del Preview
- Frase superior: "Aquí manda"
- Nombres: Max / Luna / Coco (según índice)
- Frase inferior: "No toques... ya sabemos que estás aquí"

## Edge Function: generate-tattoo (v17)
Pipeline de 4 pasos en Supabase Edge Function:
1. **BiRefNet** — remove background (Replicate)
2. **Normalize** — smart crop + 800×800 white canvas (imagescript)
3. **Upload** — pet URL a Supabase Storage bucket `pet-tattoos`
4. **Claude Haiku 3** — genera prompt optimizado con visión (sistema por estilo)
5. **FLUX 2 Pro** — genera arte final con input_images (pet + style ref)

Secrets requeridos: `REPLICATE_API_KEY`, `ANTHROPIC_API_KEY`

## Estilos disponibles
- **dibujo** — negro puro sobre blanco, estilo sello/linocut
- **icono** — vector plano con colores, estilo peekaboo minimalista