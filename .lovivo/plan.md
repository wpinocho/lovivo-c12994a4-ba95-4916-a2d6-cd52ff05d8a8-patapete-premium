# Patapete — Plan de Desarrollo

## Estado Actual
Tienda de tapetes personalizados con mascotas. El configurador tiene:
- **PhotoPetForm.tsx** — form principal con upload de foto y personalización de texto
- **CanvasPreview.tsx** — preview en tiempo real con HTML + CSS
- **canvasCompositing.ts** — export final en canvas (StepSummary)
- **generate-tattoo/index.ts** — Edge Function: pipeline de 4 pasos (BiRefNet → normalize → Claude Haiku → FLUX 2 Pro)

## Cambios Recientes

### Demo images por estilo e índice de mascota
- **`CanvasPreview.tsx`**: reemplazada la constante `DEMO_PET_URL` única por un objeto `DEMO_URLS: Record<Style, string[]>` con 3 URLs por estilo (una por slot de mascota)
  - `dibujo[0]` = terrier con bandana (sketch B&W)
  - `dibujo[1]` = French Bulldog sketch B&W
  - `dibujo[2]` = Chihuahua sketch B&W
  - `icono[0]` = French Bulldog colorido
  - `icono[1]` = Chihuahua colorido
  - `icono[2]` = French Bulldog colorido (fallback)
- El prop `style` ahora se destructura correctamente (antes se ignoraba)
- **`StepPets.tsx`**: botones de estilo reordenados → Icono izquierda, Dibujo derecha

### Estilo por default
- `PatapeteConfigurator.tsx`: `style: 'dibujo'` ya era el default (sin cambios)

### Renderizado de mascotas: sin multiply, fondo blanco removido en browser
- **`imagePreprocessing.ts`**: `removeWhiteBackground(url, threshold=238, fadeZone=25)` — remueve píxeles blancos vía canvas pixel manipulation
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