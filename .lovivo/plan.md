# Patapete — Plan de Desarrollo

## Estado Actual
Tienda de tapetes personalizados con mascotas. El configurador tiene:
- **PhotoPetForm.tsx** — form principal con upload de foto y personalización de texto
- **CanvasPreview.tsx** — preview en tiempo real con HTML + CSS
- **canvasCompositing.ts** — export final en canvas (StepSummary)
- **generate-tattoo/index.ts** — Edge Function: pipeline de 4 pasos (BiRefNet → normalize → Claude Haiku → FLUX 2 Pro)

## Cambios Recientes

### Persistencia del configurador (localStorage)
- **`types.ts`**: `Pet` ahora tiene `photoBase64: string | null` (base64 comprimida sin prefijo data-URL)
- **`PatapeteConfigurator.tsx`**: `loadFromStorage()` / `saveToStorage()` con key `patapete_v1`
  - Se carga en `useState` init, se guarda con `useEffect` en cada cambio de estado
  - En `handleGenerate`: si hay `fileToUse` comprime y guarda `photoBase64`; si no (retry tras refresh) usa `pet.photoBase64` directamente
  - Al restaurar: `photoPreviewUrl = data:image/png;base64,${photoBase64}`
- **`StepPets.tsx`**: `onGenerate(petIndex, file?)` ahora file es opcional; `allPhotosUploaded` también acepta `photoBase64` o `generatedArtUrl`
- **`PhotoPetForm.tsx`**: `onGenerate(file?)` opcional; `canRetry` también true cuando hay `photoBase64`

### Demo images por estilo e índice de mascota
- **`CanvasPreview.tsx`**: `DEMO_URLS: Record<Style, string[]>` con 3 URLs por estilo (una por slot de mascota)
  - `dibujo[0]` = terrier con bandana (sketch B&W)
  - `dibujo[1]` = French Bulldog sketch B&W
  - `dibujo[2]` = Chihuahua sketch B&W
  - `icono[0]` = terrier café con bandana colorido (peekaboo style) ← URL corregida (1773603726943-gm6jlczzsfv.webp)
  - `icono[1]` = Chihuahua colorido
  - `icono[2]` = French Bulldog colorido

### Estilo por default
- `PatapeteConfigurator.tsx`: `style: 'dibujo'` es el default

### Renderizado de mascotas: sin multiply, fondo blanco removido en browser
- **`imagePreprocessing.ts`**: `removeWhiteBackground(url, threshold=238, fadeZone=25)`
- **`CanvasPreview.tsx`**: imágenes NO se muestran hasta que el procesamiento termina (sin flash blanco)
- **`canvasCompositing.ts`**: mismo approach para el export final

## Preferencias del Usuario
- Textos en negro puro `#000000`, fontWeight 800
- Tapete es el protagonista, sin cortes en su diseño
- Preview escalado al 112% para llenar el frame
- El preview debe simular bien la sublimación (imagen nítida, no absorbida por textura)
- Dibujo es el estilo preferido y default

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
- **dibujo** — negro puro sobre blanco, estilo sello/linocut (DEFAULT)
- **icono** — vector plano con colores, estilo peekaboo minimalista