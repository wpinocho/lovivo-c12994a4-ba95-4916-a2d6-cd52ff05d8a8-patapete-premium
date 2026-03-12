// v15 — FLUX 2 Pro input_images[] (dual-URL) — both styles use style reference image
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Image } from 'https://deno.land/x/imagescript@1.2.15/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const SUPABASE_URL       = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const STYLE_REFERENCE_DIBUJO_URL =
  'https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/product-images/c12994a4-ba95-4916-a2d6-cd52ff05d8a8/style-dibujo.png'

const STYLE_REFERENCE_ICONO_URL =
  'https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773350235538-8uqgrzk0xup.webp'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── Helper: poll Replicate until done ───────────────────────────────────────
async function pollReplicate(predictionId: string, maxSeconds = 90): Promise<any> {
  const interval = 1500
  const maxAttempts = Math.ceil((maxSeconds * 1000) / interval)
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, interval))
    const res = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { 'Authorization': `Bearer ${REPLICATE_API_KEY}` },
    })
    const result = await res.json()
    if (result.status === 'succeeded') return result
    if (result.status === 'failed') throw new Error(result.error || 'Prediction failed')
  }
  throw new Error(`Timeout after ${maxSeconds}s`)
}

// ─── STEP 1: BiRefNet background removal ─────────────────────────────────────
async function removeBackgroundBiRefNet(imageBase64: string): Promise<string> {
  const modelVersion = 'f74986db0355b58403ed20963af156525e2891ea3c2d499bfbfb2a28cd87c5d7'
  console.log(`[generate-tattoo] Step 1 INPUT — BiRefNet model: ${modelVersion} | image base64 length: ${imageBase64.length}`)

  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${REPLICATE_API_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'wait=60',
    },
    body: JSON.stringify({
      version: modelVersion,
      input: {
        image: `data:image/png;base64,${imageBase64}`,
      },
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`BiRefNet request failed: ${err}`)
  }

  const prediction = await response.json()
  console.log(`[generate-tattoo] Step 1 — Prediction ID: ${prediction.id} | Status: ${prediction.status}`)

  if (prediction.status === 'succeeded') {
    const out = prediction.output
    const url = typeof out === 'string' ? out : Array.isArray(out) ? out[0] : null
    if (!url) throw new Error('BiRefNet returned empty output')
    console.log(`[generate-tattoo] Step 1 OUTPUT — transparent PNG URL: ${url}`)
    return url
  }

  if (!prediction.id) throw new Error(`BiRefNet: no prediction ID in response: ${JSON.stringify(prediction)}`)
  const result = await pollReplicate(prediction.id, 90)
  const out = result.output
  const url = typeof out === 'string' ? out : Array.isArray(out) ? out[0] : null
  if (!url) throw new Error('BiRefNet returned empty output after polling')
  console.log(`[generate-tattoo] Step 1 OUTPUT (polled) — transparent PNG URL: ${url}`)
  return url
}

// ─── STEP 2: Smart crop & normalize → 800×800 white canvas ───────────────────
async function normalizeImage(transparentPngUrl: string): Promise<string> {
  console.log(`[generate-tattoo] Step 2 INPUT — transparent PNG URL: ${transparentPngUrl}`)

  const res = await fetch(transparentPngUrl)
  if (!res.ok) throw new Error(`Failed to download BiRefNet output: ${res.status}`)
  const bytes = new Uint8Array(await res.arrayBuffer())
  const img = await Image.decode(bytes)

  console.log(`[generate-tattoo] Step 2 — decoded image: ${img.width}×${img.height}`)

  let minX = img.width + 1, minY = img.height + 1, maxX = 0, maxY = 0

  for (let y = 1; y <= img.height; y++) {
    for (let x = 1; x <= img.width; x++) {
      const alpha = Image.colorToRGBA(img.getPixelAt(x, y))[3]
      if (alpha > 10) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  if (maxX <= minX || maxY <= minY) {
    throw new Error('No subject found in image (BiRefNet returned empty mask)')
  }

  const subjectX0 = minX - 1
  const subjectY0 = minY - 1
  const subjectW = maxX - minX + 1
  const subjectH = maxY - minY + 1
  console.log(`[generate-tattoo] Step 2 — subject bounding box: ${subjectW}×${subjectH} at (${subjectX0}, ${subjectY0})`)

  const pad = Math.round(Math.max(subjectW, subjectH) * 0.15)

  const cropX = Math.max(0, subjectX0 - pad)
  const cropY = Math.max(0, subjectY0 - pad)
  const cropW = Math.min(img.width  - cropX, subjectW + pad * 2)
  const cropH = Math.min(img.height - cropY, subjectH + pad * 2)

  img.crop(cropX, cropY, cropW, cropH)

  const targetSize = 800
  const longestSide = Math.max(img.width, img.height)
  const scale  = (targetSize * 0.88) / longestSide
  const scaledW = Math.max(1, Math.round(img.width  * scale))
  const scaledH = Math.max(1, Math.round(img.height * scale))
  img.resize(scaledW, scaledH)

  const canvas = new Image(targetSize, targetSize)
  canvas.fill(0xFFFFFFFF)

  const offsetX = Math.round((targetSize - scaledW) / 2)
  const offsetY = Math.round((targetSize - scaledH) / 2)
  canvas.composite(img, offsetX, offsetY)

  const encoded = await canvas.encode()
  let binary = ''
  for (let i = 0; i < encoded.length; i++) {
    binary += String.fromCharCode(encoded[i])
  }
  const base64 = btoa(binary)
  console.log(`[generate-tattoo] Step 2 OUTPUT — normalized 800×800 canvas | base64 length: ${base64.length}`)
  return base64
}

// ─── STEP 2.5: Upload normalized pet image to Supabase Storage → public URL ──
async function uploadNormalizedPet(base64: string): Promise<string> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  const filename = `temp/pet-${Date.now()}.png`

  console.log(`[generate-tattoo] Step 2.5 INPUT — uploading normalized pet to Storage: ${filename}`)

  const { error } = await supabase.storage
    .from('pet-tattoos')
    .upload(filename, bytes, { contentType: 'image/png', upsert: true })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const { data } = supabase.storage.from('pet-tattoos').getPublicUrl(filename)
  console.log(`[generate-tattoo] Step 2.5 OUTPUT — pet URL: ${data.publicUrl}`)
  return data.publicUrl
}

// ─── STEP 3: Claude Haiku 3 → generate optimized prompt ─────────────────────
const SYSTEM_PROMPT_ICONO = `Eres un director de arte experto. Tu tarea es analizar la foto de esta mascota y generar un prompt para recrearla en estilo vector flat geométrico, con contornos gruesos negros y colores sólidos planos — exactamente como el estilo de la imagen de referencia de estilo que verá el modelo.

Analiza la imagen y extrae:

1. Tipo de animal y raza aproximada.
2. Textura del pelo y forma (ej. pelo alambre/scruffy con puntas angulares, pelo liso y corto, esponjoso en bloques).
3. Colores principales exactos del pelaje (ej. café oscuro, beige crema, marrón rojizo).
4. Rasgos físicos más distintivos (ej. orejas semi-caídas, morro oscuro, cejas marcadas).
5. Accesorios visibles simplificados a un solo color sólido (ej. paliacate rojo oscuro, collar azul).

Ahora REEMPLAZA los corchetes en esta plantilla exacta (mantén en inglés). Devuelve ÚNICAMENTE el prompt completado, sin introducciones:

A 'peekaboo' portrait of a [TIPO DE ANIMAL Y RAZA], head and upper chest only, paws resting on a thick solid black horizontal line at the bottom. PURE WHITE BACKGROUND (#FFFFFF).
STYLE: Flat geometric vector illustration with extremely thick, bold black outlines. Angular, spiky shapes for fur — NO smooth curves, NO gradients, NO shading. ONLY flat solid color fills.
FUR: [TEXTURA Y FORMA DEL PELO], rendered as sharp angular spike shapes and geometric blocks of flat color.
COLOR PALETTE: [COLORES PRINCIPALES]. Black outlines. Pink tongue. White highlights as flat shapes.
KEY FEATURES: [RASGOS DISTINTIVOS Y ACCESORIOS simplified to single solid colors]. Bold, graphic, print-ready icon style.`

const SYSTEM_PROMPT_DIBUJO = `Eres un director de arte experto. Tu tarea es analizar la foto de esta mascota y generar un prompt de generación de imagen para un retrato en puro blanco y negro, estilo sello o grabado de líneas gruesas.

Analiza la imagen y extrae ÚNICAMENTE información estructural (ignora los colores del pelaje, ya que el diseño será blanco y negro):

Tipo de animal y raza aproximada.

Rasgos físicos estructurales más distintivos (ej. orejas muy grandes y caídas, hocico chato, arrugas profundas, pelo muy rizado en forma de bloques).

Accesorios visibles (ej. lleva un collar grueso o un paliacate).

Ahora, toma esa información y REEMPLAZA los corchetes en esta plantilla exacta (mantén la plantilla en inglés). Devuelve ÚNICAMENTE el texto de la plantilla completada, sin introducciones ni explicaciones:

A standardized 'peekaboo' portrait of a [TIPO DE ANIMAL Y RAZA APROXIMADA], head and upper chest ONLY, centered, paws on a solid border line at the bottom. ISOLATED SUBJECT on a PURE ABSOLUTE WHITE BACKGROUND (#FFFFFF).
STYLE: Pure black and white minimalist line art. ONLY black ink on white background. NO grayscale, NO shading, NO fine details.
CRITICAL: The entire portrait is constructed using ONLY extremely thick, chunky, bold black lines. The drawing lines should be slightly imperfect and heavy, resembling a bold linocut, rubber stamp, or stencil print.
PRESERVE KEY STRUCTURAL FEATURES: [RASGOS FÍSICOS ESTRUCTURALES Y ACCESORIOS], but strictly abstract and simplify them into this chunky, heavy-line graphic execution. No thin strokes. Stencil-like simplicity ready for coarse material printing.`

async function generatePromptWithVision(normalizedBase64: string, style: 'dibujo' | 'icono'): Promise<string> {
  if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY secret not configured')

  const systemPrompt = style === 'icono' ? SYSTEM_PROMPT_ICONO : SYSTEM_PROMPT_DIBUJO
  const t0 = Date.now()

  console.log(`[generate-tattoo] Step 3 INPUT — Claude Haiku:`)
  console.log(`  style: ${style}`)
  console.log(`  model: claude-3-haiku-20240307`)
  console.log(`  image base64 length: ${normalizedBase64.length}`)
  console.log(`  system prompt (full):\n---\n${systemPrompt}\n---`)

  const requestBody = {
    model: 'claude-3-haiku-20240307',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: normalizedBase64,
            },
          },
          {
            type: 'text',
            text: 'Analiza esta imagen y genera el prompt según las instrucciones anteriores. Devuelve ÚNICAMENTE el texto del prompt completado, sin introducciones ni explicaciones.',
          },
        ],
      },
    ],
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Claude Haiku request failed (${response.status}): ${err}`)
  }

  const result = await response.json()
  const text = result?.content?.[0]?.text
  if (!text) throw new Error('Claude Haiku returned empty output')

  const elapsed = Date.now() - t0
  console.log(`[generate-tattoo] Step 3 OUTPUT — Claude Haiku done in ${elapsed}ms`)
  console.log(`[generate-tattoo] Step 3 OUTPUT — prompt generated (full text):\n---\n${text.trim()}\n---`)
  return text.trim()
}

// ─── STEP 4: FLUX 2 Pro → final art via input_images[] ───────────────────────
//
// Strategy:
//   DIBUJO — input_images = [petUrl, styleRefUrl]
//            Prompt tells FLUX: first image = pet to recreate, second = style to apply
//   ICONO  — input_images = [petUrl, styleRefIconoUrl]
//            Prompt tells FLUX: first image = pet to recreate, second = flat vector style to apply
//
async function generateWithFlux2Pro(
  petUrl: string,
  haikuPrompt: string,
  artStyle: 'dibujo' | 'icono'
): Promise<string> {
  let inputImages: string[]
  let finalPrompt: string

  if (artStyle === 'dibujo') {
    inputImages = [petUrl, STYLE_REFERENCE_DIBUJO_URL]
    finalPrompt = `The first image is the pet to recreate. The second image is the exact art style reference to apply.\nGenerate a portrait of the pet from the first image, applying STRICTLY the visual style, line weight, and artistic technique shown in the second image.\n${haikuPrompt}`
  } else {
    inputImages = [petUrl, STYLE_REFERENCE_ICONO_URL]
    finalPrompt = `The first image is the pet to recreate. The second image is the exact art style reference to apply.\nGenerate a portrait of the pet from the first image, applying STRICTLY the flat geometric vector style, bold black outlines, angular fur shapes, and solid color palette shown in the second image.\n${haikuPrompt}`
  }

  console.log(`[generate-tattoo] Step 4 INPUT — FLUX 2 Pro:`)
  console.log(`  model: black-forest-labs/flux-2-pro`)
  console.log(`  style: ${artStyle}`)
  console.log(`  input_images: ${JSON.stringify(inputImages)}`)
  console.log(`  aspect_ratio: 1:1 | resolution: 1 MP | output_format: webp`)
  console.log(`  prompt (full text):\n---\n${finalPrompt}\n---`)

  const fluxInput = {
    prompt: finalPrompt,
    input_images: inputImages,
    aspect_ratio: '1:1',
    resolution: '1 MP',
    output_format: 'webp',
    output_quality: 80,
    safety_tolerance: 2,
  }

  const response = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-2-pro/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${REPLICATE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input: fluxInput }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(`FLUX 2 Pro error: ${JSON.stringify(err)}`)
  }

  const prediction = await response.json()
  if (!prediction.id) throw new Error(`FLUX 2 Pro: no prediction ID. Response: ${JSON.stringify(prediction)}`)

  console.log(`[generate-tattoo] Step 4 — FLUX prediction submitted | ID: ${prediction.id} | polling up to 120s...`)

  const result = await pollReplicate(prediction.id, 120)
  const out = result.output
  const url = Array.isArray(out) ? out[0] : out
  if (!url) throw new Error('FLUX 2 Pro returned no image URL')

  console.log(`[generate-tattoo] Step 4 OUTPUT — FLUX 2 Pro result URL: ${url}`)
  return url
}

// ─── Main handler ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    if (!REPLICATE_API_KEY) throw new Error('REPLICATE_API_KEY secret not configured')
    if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY secret not configured')

    const { imageBase64, petName, style } = await req.json()
    if (!imageBase64) throw new Error('imageBase64 is required')

    const artStyle: 'dibujo' | 'icono' = style === 'icono' ? 'icono' : 'dibujo'

    console.log(`[generate-tattoo] ═══ PIPELINE START ═══`)
    console.log(`[generate-tattoo] INPUT — petName: "${petName || 'unnamed'}" | style: ${artStyle} | imageBase64 length: ${imageBase64.length}`)

    // Step 1: Remove background
    console.log('[generate-tattoo] ─── Step 1: BiRefNet background removal ───')
    const t1 = Date.now()
    const transparentPngUrl = await removeBackgroundBiRefNet(imageBase64)
    console.log(`[generate-tattoo] Step 1 done in ${Date.now() - t1}ms`)

    // Step 2: Smart crop + normalize
    console.log('[generate-tattoo] ─── Step 2: Smart crop & normalize ───')
    const t2 = Date.now()
    const normalizedBase64 = await normalizeImage(transparentPngUrl)
    console.log(`[generate-tattoo] Step 2 done in ${Date.now() - t2}ms`)

    // Step 2.5: Upload normalized pet to Storage → public URL
    console.log('[generate-tattoo] ─── Step 2.5: Upload pet to Supabase Storage ───')
    const t25 = Date.now()
    const petUrl = await uploadNormalizedPet(normalizedBase64)
    console.log(`[generate-tattoo] Step 2.5 done in ${Date.now() - t25}ms`)

    // Step 3: Claude Haiku → optimized prompt
    console.log('[generate-tattoo] ─── Step 3: Claude Haiku 3 prompt generation ───')
    const t3 = Date.now()
    const optimizedPrompt = await generatePromptWithVision(normalizedBase64, artStyle)
    console.log(`[generate-tattoo] Step 3 done in ${Date.now() - t3}ms`)

    // Step 4: FLUX 2 Pro → final art
    console.log('[generate-tattoo] ─── Step 4: FLUX 2 Pro generation ───')
    const t4 = Date.now()
    const artUrl = await generateWithFlux2Pro(petUrl, optimizedPrompt, artStyle)
    console.log(`[generate-tattoo] Step 4 done in ${Date.now() - t4}ms`)

    const totalMs = Date.now() - t1
    console.log(`[generate-tattoo] ═══ PIPELINE COMPLETE — total time: ${totalMs}ms ═══`)
    console.log(`[generate-tattoo] FINAL OUTPUT URL: ${artUrl}`)

    return new Response(JSON.stringify({ url: artUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[generate-tattoo] ═══ ERROR ═══', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})