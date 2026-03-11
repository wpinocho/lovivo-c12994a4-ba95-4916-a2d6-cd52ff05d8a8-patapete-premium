# Patapete — Plan: Flujo de Generación de Retratos v2

## Estado actual (lo que hay)
- **backgroundRemoval.ts**: Usa `@imgly/background-removal` → WASM en navegador. Lento, calidad media.
- **replicateApi.ts**: Llama edge function `generate-tattoo` con la imagen ya sin fondo.
- **generate-tattoo/index.ts**: Recibe base64 → FLUX Schnell img2img (versión `5599ed3...`) → 4 pasos de inferencia → resultado mediocre.
- **canvasCompositing.ts**: Dibuja tapete mockup + pets en círculos clippeados + texto. No usa multiply blend.
- **PatapeteConfigurator.tsx**: Flow: removeBackground (browser) → generateTattooArt (edge fn).

## El nuevo flujo completo

```
[Usuario sube foto]
      ↓
[Frontend] compressImage() → max 1024×1024, PNG base64
      ↓
[Edge Function: generate-tattoo v2]
  1. remove.bg API → PNG transparente recortado (crop: true)
  2. Smart crop + normalize → 800×800 fondo blanco (imagescript Deno)
  3. FLUX Dev img2img → line art, fondo blanco, alta calidad
      ↓
[Frontend] Canvas compositing con ctx.globalCompositeOperation = 'multiply'
  → Blanco desaparece, líneas oscuras se "tatúan" sobre textura del tapete
```

## Archivos a crear/modificar

### NUEVO: `src/utils/imagePreprocessing.ts`
Función `compressAndResizeImage(file: File): Promise<string>`:
- Crear canvas, drawImage
- Resize a max 1024×1024 conservando aspect ratio
- `canvas.toDataURL('image/png')` → string base64
- Quitar el prefijo `data:image/png;base64,` para enviar al backend

### MODIFICAR: `src/utils/backgroundRemoval.ts`
- Eliminar toda la lógica de `@imgly/background-removal`
- Convertir en no-op / eliminar el import del `PatapeteConfigurator`
- El background removal ahora ocurre en el backend (edge function)

### MODIFICAR: `src/utils/replicateApi.ts`
Simplificar `generateTattooArt(imageBase64, petName, onProgress)`:
- Ya NO recibe imagen sin fondo — recibe la imagen ORIGINAL comprimida
- Llama a `userSupabase.functions.invoke('generate-tattoo', { body: { imageBase64, petName } })`
- Callbacks de progreso: 'Analizando tu mascota...', 'Recortando y preparando imagen...', 'Creando retrato con IA... (~30s)', '¡Retrato listo!'
- Retorna la URL de la imagen generada

### MODIFICAR: `src/components/patapete/configurator/PatapeteConfigurator.tsx`
`handleGenerate(petIndex, fileOverride?)`:
- ELIMINAR: import y llamada a `removeBackground()`
- NUEVO FLOW:
  1. `updatePet({ isProcessingBg: true })` (reutilizamos este flag para "preparando imagen")
  2. `const compressed = await compressAndResizeImage(fileToUse)` 
  3. `updatePet({ isProcessingBg: false, isGeneratingArt: true })`
  4. `const artUrl = await generateTattooArt(compressed, pet.name, onProgress)`
  5. `updatePet({ generatedArtUrl: artUrl, isGeneratingArt: false })`

Actualizar status messages en `PhotoPetForm.tsx`:
- `isProcessingBg` → 'Preparando imagen...'
- `isGeneratingArt` → 'Creando tu retrato con IA... (~35s)'

### MODIFICAR: `src/utils/canvasCompositing.ts`
**Cambio clave: de clips circulares a slots rectangulares + multiply blend mode**

```
function getPetSlots(count, W, H): Array<{x, y, w, h}>
```
Layout de slots:
- 1 pet: cuadrado centrado, ~60% del ancho, centrado verticalmente
- 2 pets: dos cuadrados lado a lado, 42% ancho cada uno, gap entre ellos
- 3 pets: un cuadrado central grande + dos más pequeños a los lados

Nuevo `compositeRug()`:
1. Dibujar tapete mockup (igual que antes)
2. Para cada pet:
   - `ctx.save()`
   - Si demo: `ctx.globalAlpha = 0.4`
   - `ctx.globalCompositeOperation = 'multiply'`
   - `ctx.drawImage(petImg, x, y, w, h)` — fondo blanco desaparece, líneas quedan
   - `ctx.restore()`
3. Nombres de mascotas debajo de cada slot (igual que antes)
4. Frase al pie (igual que antes)

NOTA IMPORTANTE: Si la imagen del pet aún tiene fondo (demo images o foto original), multiply también funciona. Solo que el efecto es menos limpio. Con las imágenes generadas por FLUX (fondo blanco sólido) el efecto es perfecto.

### REESCRIBIR COMPLETAMENTE: `supabase/functions/generate-tattoo/index.ts`

```typescript
// v5 - Full pipeline: remove.bg + smart crop + FLUX Dev

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Image } from 'https://deno.land/x/imagescript@1.2.15/mod.ts'

const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY')!
const REMOVE_BG_API_KEY = Deno.env.get('REMOVE_BG_API_KEY')!

// STEP 1: remove.bg API
async function removeBackground(imageBase64: string): Promise<Uint8Array> {
  const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: {
      'X-Api-Key': REMOVE_BG_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_file_b64: imageBase64,
      size: 'auto',
      format: 'png',
      crop: true,
      crop_margin: '0px',
    }),
  })
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`remove.bg error: ${err}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return new Uint8Array(arrayBuffer)
}

// STEP 2: Smart crop → center on 800x800 white canvas
async function normalizeImage(pngBytes: Uint8Array): Promise<string> {
  const img = await Image.decode(pngBytes)
  
  // Find bounding box of non-transparent pixels
  let minX = img.width, minY = img.height, maxX = 0, maxY = 0
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const alpha = Image.colorToRGBA(img.getPixelAt(x + 1, y + 1))[3]
      if (alpha > 10) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  
  const subjectW = maxX - minX
  const subjectH = maxY - minY
  
  // Expand bounding box: 20% sides, 10% top, 40% bottom
  const padSide = Math.round(subjectW * 0.20)
  const padTop = Math.round(subjectH * 0.10)
  const padBottom = Math.round(subjectH * 0.40)
  
  const cropX = Math.max(0, minX - padSide)
  const cropY = Math.max(0, minY - padTop)
  const cropW = Math.min(img.width - cropX, subjectW + padSide * 2)
  const cropH = Math.min(img.height - cropY, subjectH + padTop + padBottom)
  
  const cropped = img.crop(cropX, cropY, cropW, cropH)
  
  // Scale to fit in 800x800 with subject at ~75% height
  const targetSize = 800
  const scale = (targetSize * 0.75) / cropped.height
  const scaledW = Math.round(cropped.width * scale)
  const scaledH = Math.round(cropped.height * scale)
  
  cropped.resize(scaledW, scaledH)
  
  // Create 800x800 white canvas
  const canvas = new Image(targetSize, targetSize)
  canvas.fill(0xFFFFFFFF) // white background
  
  // Center the cropped pet on the canvas
  const offsetX = Math.round((targetSize - scaledW) / 2)
  const offsetY = Math.round((targetSize - scaledH) / 2)
  
  canvas.composite(cropped, offsetX, offsetY)
  
  const encoded = await canvas.encode()
  // Convert to base64
  let binary = ''
  for (let i = 0; i < encoded.length; i++) {
    binary += String.fromCharCode(encoded[i])
  }
  return btoa(binary)
}

// STEP 3: FLUX Dev img2img
const PROMPT = `A clean, minimalist line art illustration of this exact pet, designed for laser engraving on a doormat. Dark brown bold linework, solid white background, elegant outlining, minimal shading, high contrast. Product-ready composition, premium home decor aesthetic.`
const NEGATIVE_PROMPT = `photorealistic, 3D render, complex background, colors, messy lines, text, watermark, abstract art, low quality, blurry`

// Using flux-dev model for better quality
const FLUX_DEV_IMG2IMG_VERSION = 'a45f82a1382bed5c7aeb861dac7c7d191b0fdf74d8d9a7c9dbb78cadb3a7a89'
// Note: verify this version hash on Replicate — it's the flux-dev img2img version

async function generateWithFlux(normalizedBase64: string, petName: string): Promise<string> {
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${REPLICATE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: FLUX_DEV_IMG2IMG_VERSION,
      input: {
        image: `data:image/png;base64,${normalizedBase64}`,
        prompt: PROMPT,
        negative_prompt: NEGATIVE_PROMPT,
        image_strength: 0.75,
        num_inference_steps: 28,
        guidance_scale: 7.5,
        num_outputs: 1,
        aspect_ratio: '1:1',
        output_format: 'webp',
        output_quality: 92,
      },
    }),
  })
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(`Replicate error: ${err.detail || response.statusText}`)
  }
  
  const prediction = await response.json()
  
  // Poll (max 120s = 80 × 1500ms)
  for (let i = 0; i < 80; i++) {
    await new Promise(r => setTimeout(r, 1500))
    const poll = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      headers: { 'Authorization': `Token ${REPLICATE_API_KEY}` },
    })
    const result = await poll.json()
    if (result.status === 'succeeded') {
      const url = result.output?.[0]
      if (!url) throw new Error('No image URL in Replicate response')
      return url
    }
    if (result.status === 'failed') throw new Error(result.error || 'Generation failed')
  }
  
  throw new Error('Timeout: generation took too long')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  
  try {
    if (!REPLICATE_API_KEY) throw new Error('REPLICATE_API_KEY not configured')
    if (!REMOVE_BG_API_KEY) throw new Error('REMOVE_BG_API_KEY not configured')
    
    const { imageBase64, petName } = await req.json()
    if (!imageBase64) throw new Error('imageBase64 is required')
    
    // Pipeline
    const bgRemovedBytes = await removeBackground(imageBase64)
    const normalizedBase64 = await normalizeImage(bgRemovedBytes)
    const artUrl = await generateWithFlux(normalizedBase64, petName)
    
    return new Response(JSON.stringify({ url: artUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

## Secrets necesarios

| Secret | Estado | Acción |
|--------|--------|--------|
| `REPLICATE_API_KEY` | ✅ Ya existe | Nada |
| `REMOVE_BG_API_KEY` | ❌ Nuevo | Usuario debe crear cuenta en remove.bg → obtener API key → guardar en Supabase Secrets |

## Orden de implementación en Craft Mode

1. **Crear `src/utils/imagePreprocessing.ts`** — resize/compress client-side
2. **Reescribir `supabase/functions/generate-tattoo/index.ts`** — pipeline completo
3. **Modificar `src/utils/replicateApi.ts`** — simplificar, ya no recibe imagen sin fondo
4. **Modificar `src/components/patapete/configurator/PatapeteConfigurator.tsx`** — quitar removeBackground, añadir compressImage
5. **Modificar `src/utils/canvasCompositing.ts`** — slots rectangulares + multiply blend mode
6. **Limpiar `src/utils/backgroundRemoval.ts`** — eliminar o vaciar (ya no se usa)

## Notas técnicas importantes

### Sobre FLUX Dev img2img en Replicate
- El modelo `black-forest-labs/flux-dev` usa `prompt_strength` en lugar de `image_strength` (0.0 = full image, 1.0 = full prompt)
- Verificar version hash correcto en https://replicate.com/black-forest-labs/flux-dev
- Alternativa si flux-dev no soporta img2img: usar `xlabs-ai/flux-dev-realism` que sí lo soporta nativamente

### Sobre imagescript en Deno
- Import: `import { Image } from 'https://deno.land/x/imagescript@1.2.15/mod.ts'`
- Funciona en Supabase Edge Functions (es puro TypeScript/WASM sin deps nativas)
- `img.getPixelAt(x+1, y+1)` — OJO: imagescript usa coordenadas 1-indexed
- `img.crop(x, y, w, h)` — modifica in-place, retorna la misma imagen
- `canvas.composite(src, x, y)` — pega src sobre canvas en posición (x,y)

### Sobre canvas multiply blend mode
- En Canvas 2D: `ctx.globalCompositeOperation = 'multiply'`
- Efecto: blanco (255,255,255) × tapete_color / 255 = tapete_color → blanco se vuelve invisible
- Negro (0,0,0) × tapete_color / 255 = 0 → líneas oscuras se tatúan sobre la textura
- IMPORTANTE: resetear a 'source-over' después de dibujar cada pet

### Sobre remove.bg API
- Free tier: 50 imágenes/mes. Paid: $9/mes para ~500 imágenes.
- Endpoint: `POST https://api.remove.bg/v1.0/removebg`
- Con `crop: true` → devuelve automáticamente recortado al sujeto
- Con `crop_margin: '0px'` → sin margen extra (nosotros añadimos el nuestro en el smart crop)

### Potencial upgrade futuro: Style Card con IP-Adapter
- Usar `xlabs-ai/flux-ip-adapter` en Replicate
- `image`: pet normalizado (content reference)
- `image_prompt`: URL de la style card de Patapete (style reference)
- `image_prompt_strength`: 0.55
- Requiere diseñar una style card fija que defina la estética visual de la marca