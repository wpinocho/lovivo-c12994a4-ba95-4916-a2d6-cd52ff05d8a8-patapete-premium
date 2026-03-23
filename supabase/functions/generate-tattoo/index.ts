// v22 — Step 4: Google Gemini 2.0 Flash Preview Image Generation
//   Steps 1 & 5.5: fal-ai/birefnet  (real BiRefNet, ~1-2s, no GPU queue)
//   Step 4:        gemini-2.0-flash-preview-image-generation (inline_data, no queue)
//   Note: gemini-2.5-flash does NOT support image generation. Use the dedicated model.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Image } from 'https://deno.land/x/imagescript@1.2.15/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FALAI_API_KEY            = Deno.env.get('FALAI_API_KEY')!
const ANTHROPIC_API_KEY        = Deno.env.get('ANTHROPIC_API_KEY')!
const GEMINI_API_KEY           = Deno.env.get('GEMINI_API_KEY')!
const SUPABASE_URL             = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const STYLE_REFERENCE_DIBUJO_URL =
  'https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/product-images/c12994a4-ba95-4916-a2d6-cd52ff05d8a8/style-dibujo.png'

const STYLE_REFERENCE_ICONO_URL =
  'https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773698793129-msnlow463lm.webp'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── Helper: poll Fal queue until COMPLETED ───────────────────────────────────
async function pollFal(statusUrl: string, responseUrl: string, maxSeconds = 120): Promise<any> {
  const interval = 1500
  const maxAttempts = Math.ceil((maxSeconds * 1000) / interval)

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, interval))

    const statusRes = await fetch(statusUrl, {
      headers: { 'Authorization': `Key ${FALAI_API_KEY}` },
    })
    if (!statusRes.ok) {
      const err = await statusRes.text()
      throw new Error(`Fal status check failed: ${err}`)
    }
    const status = await statusRes.json()
    console.log(`[generate-tattoo] Fal poll — status: ${status.status} (attempt ${i + 1})`)

    if (status.status === 'COMPLETED') {
      const resultRes = await fetch(responseUrl, {
        headers: { 'Authorization': `Key ${FALAI_API_KEY}` },
      })
      if (!resultRes.ok) {
        const err = await resultRes.text()
        throw new Error(`Fal result fetch failed: ${err}`)
      }
      return await resultRes.json()
    }

    if (status.status === 'FAILED' || status.error) {
      throw new Error(`Fal prediction failed: ${status.error || JSON.stringify(status)}`)
    }
  }
  throw new Error(`Fal poll timeout after ${maxSeconds}s`)
}

// ─── Helper: submit to Fal queue → { request_id, status_url, response_url } ──
async function submitFal(endpoint: string, input: Record<string, unknown>): Promise<{ requestId: string; statusUrl: string; responseUrl: string }> {
  const url = `https://queue.fal.run/${endpoint}`
  console.log(`[generate-tattoo] Fal submit → ${url}`)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FALAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Fal submit to ${endpoint} failed (${res.status}): ${err}`)
  }

  const data = await res.json()
  if (!data.request_id) throw new Error(`Fal submit: no request_id in response: ${JSON.stringify(data)}`)

  console.log(`[generate-tattoo] Fal submitted — request_id: ${data.request_id} | queue_position: ${data.queue_position ?? 'n/a'}`)

  return {
    requestId: data.request_id,
    statusUrl: data.status_url  || `https://queue.fal.run/${endpoint}/requests/${data.request_id}/status`,
    responseUrl: data.response_url || `https://queue.fal.run/${endpoint}/requests/${data.request_id}`,
  }
}

// ─── STEPS 1 & 5.5: fal-ai/birefnet background removal ──────────────────────
// Uses the real BiRefNet model (not rembg). No GPU cold-start queue on Fal.
async function removeBackgroundFal(imageUrl: string, stepLabel: string): Promise<string> {
  console.log(`[generate-tattoo] ${stepLabel} INPUT — fal-ai/birefnet | image: ${imageUrl.startsWith('data:') ? `base64 (${imageUrl.length} chars)` : imageUrl}`)

  const { statusUrl, responseUrl } = await submitFal('fal-ai/birefnet', {
    image_url: imageUrl,
    model: 'General Use (Light)',
    operating_resolution: '1024x1024',
    refine_foreground: true,
    output_format: 'png',
  })

  const result = await pollFal(statusUrl, responseUrl, 60)

  const url = result?.image?.url
  if (!url) throw new Error(`fal-ai/birefnet (${stepLabel}) returned no image URL. Response: ${JSON.stringify(result)}`)

  console.log(`[generate-tattoo] ${stepLabel} OUTPUT — transparent PNG URL: ${url}`)
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
const SYSTEM_PROMPT_ICONO = `Eres un director de arte experto. Tu tarea es analizar la foto de esta mascota y generar un prompt de generación de imagen para un modelo texto-a-imagen.

Analiza la imagen y extrae lo siguiente:

Tipo de animal. (ej: perro, gato, caballo, etc)

Textura del pelo (ej. liso y corto, esponjoso, alambre/scruffy).

Colores principales. EXACT COLORS FROM IMAGE (ej. café chocolate, negro con machas blancas).

Rasgos distintivos CRÍTICOS y accesorios (ej. ojos azul claro muy llamativos, orejas caídas, collar/paliacate simplificado a un solo color).

Ahora, toma esa información y REEMPLAZA los corchetes en esta plantilla exacta (mantén la plantilla en inglés). Devuelve ÚNICAMENTE el texto de la plantilla completada, sin introducciones ni explicaciones:

Plantilla:
A standardized minimalist 'peekaboo' portrait of a [TIPO DE ANIMAL], head and upper chest ONLY, centered, paws resting on a solid, thick black horizontal line at the bottom edge. CRITICAL: the line is ONE pixel-thin stroke only — NO filled black panel, NO solid block, NO thick bar, NO black area below the line. ISOLATED SUBJECT on a PURE ABSOLUTE WHITE BACKGROUND (#FFFFFF).
STYLE: Minimalist flat vector illustration, highly simplified graphic art. The entire portrait is constructed using thick, clean, bold black outlines.
CRITICAL: The fur texture is [TEXTURA DEL PELO], represented using simplified, defined shapes of color. DO NOT USE stippling, dots, or hatching lines. Use ONLY SOLID, FLAT COLORS (cell-shaded style). Strictly simplify all accessories to solid colors with NO complex patterns.
LIMITED COLOR PALETTE: [Colores principales]. Solid black for outlines.  CRITICAL IDENTIFYING FEATURES TO PRESERVE: [RASGOS DISTINTIVOS CRÍTICOS Y ACCESORIOS]. Print-ready, stencil-like simplicity for coarse materials.`

const SYSTEM_PROMPT_DIBUJO = `Eres un director de arte experto. Tu tarea es analizar la foto de esta mascota y generar un prompt de generación de imagen para un retrato en puro blanco y negro, estilo sello o grabado de líneas gruesas.

Analiza la imagen y extrae ÚNICAMENTE información estructural (ignora los colores del pelaje, ya que el diseño será blanco y negro):

Tipo de animal y raza aproximada.

Rasgos físicos estructurales más distintivos, indicando explícitamente si los ojos están abiertos o cerrados (ej. orejas muy grandes y caídas, hocico chato, ojos cerrados).

Accesorios visibles (ej. lleva un collar grueso o un paliacate).

Ahora, toma esa información y REEMPLAZA los corchetes en esta plantilla exacta (mantén la plantilla en inglés). Devuelve ÚNICAMENTE el texto de la plantilla completada, sin introducciones ni explicaciones:

A standardized 'peekaboo' portrait of a [TIPO DE ANIMAL Y RAZA APROXIMADA], head and upper chest ONLY, centered, paws resting on a single thin black horizontal stroke line at the bottom edge. CRITICAL: the line is ONE thin stroke only — NO filled black panel, NO solid block below the line. ISOLATED SUBJECT on a PURE ABSOLUTE WHITE BACKGROUND (#FFFFFF).
STYLE: Pure black and white minimalist line art. ONLY black ink on white background. NO grayscale, NO shading, NO fine details.
CRITICAL: The entire portrait is constructed using ONLY extremely thick, chunky, bold black lines. The drawing lines should be slightly imperfect and heavy, resembling a bold linocut, rubber stamp, or stencil print.
PRESERVE KEY STRUCTURAL FEATURES: [RASGOS FÍSICOS ESTRUCTURALES Y ACCESORIOS — MUST INCLUDE: eyes open or closed], but strictly abstract and simplify them into this chunky, heavy-line graphic execution. No thin strokes. Stencil-like simplicity ready for coarse material printing.`

async function generatePromptWithVision(normalizedBase64: string, style: 'dibujo' | 'icono'): Promise<string> {
  if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY secret not configured')

  const systemPrompt = style === 'icono' ? SYSTEM_PROMPT_ICONO : SYSTEM_PROMPT_DIBUJO
  const t0 = Date.now()

  console.log(`[generate-tattoo] Step 3 INPUT — Claude Haiku 4.5:`)
  console.log(`  style: ${style}`)
  console.log(`  model: claude-3-haiku-20240307`)
  console.log(`  image base64 length: ${normalizedBase64.length}`)
  console.log(`  system prompt (full):\n---\n${systemPrompt}\n---`)

  const requestBody = {
    model: 'claude-haiku-4-5',
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

// ─── Helper: fetch URL → base64 string (chunked to avoid stack overflow) ──────
async function urlToBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch image from ${url}: ${res.status}`)
  const bytes = new Uint8Array(await res.arrayBuffer())

  // Detect mime type from Content-Type header or URL extension
  const ct = res.headers.get('content-type') || ''
  let mimeType = 'image/jpeg'
  if (ct.includes('png') || url.endsWith('.png')) mimeType = 'image/png'
  else if (ct.includes('webp') || url.endsWith('.webp')) mimeType = 'image/webp'
  else if (ct.includes('jpeg') || ct.includes('jpg') || url.endsWith('.jpg') || url.endsWith('.jpeg')) mimeType = 'image/jpeg'

  // Chunked btoa to avoid stack overflow on large images
  let binary = ''
  const chunkSize = 32768
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return { base64: btoa(binary), mimeType }
}

// ─── STEP 4: Google Gemini 2.0 Flash Preview Image Generation → final art ──────
//
// Strategy:
//   Both images passed as inline_data parts (base64)
//   Image 1 = pet (normalized), Image 2 = style reference
//   Gemini returns image as inline_data in response
//   Model: gemini-2.0-flash-preview-image-generation (only model that supports image output)
//
async function generateWithGemini(
  petUrl: string,
  haikuPrompt: string,
  artStyle: 'dibujo' | 'icono'
): Promise<{ base64: string; mimeType: string }> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY secret not configured')

  const styleRefUrl = artStyle === 'dibujo' ? STYLE_REFERENCE_DIBUJO_URL : STYLE_REFERENCE_ICONO_URL

  console.log(`[generate-tattoo] Step 4 — fetching images as inline_data for Gemini...`)
  const [pet, styleRef] = await Promise.all([
    urlToBase64(petUrl),
    urlToBase64(styleRefUrl),
  ])
  console.log(`[generate-tattoo] Step 4 — pet: ${pet.mimeType} (${pet.base64.length} chars) | style: ${styleRef.mimeType} (${styleRef.base64.length} chars)`)

  let finalPrompt: string
  if (artStyle === 'dibujo') {
    finalPrompt = `The first image is the pet to recreate. The second image is the exact art style reference to apply.
Generate a portrait of the pet from the first image, applying STRICTLY the visual style, line weight, and artistic technique shown in the second image.
${haikuPrompt}`
  } else {
    finalPrompt = `The first image is the pet to recreate. The second image is the EXACT art style reference to apply.
Generate a minimalist flat vector portrait of the pet from the first image. The output MUST match the style of the second image EXACTLY: bold clean outlines, solid color fills, flat/cel-shaded, white background. NO sketchy lines, NO fine detail texture, NO painterly look.
CRITICAL COLOR RULE: Use ONLY the EXACT colors visible in the first image. DO NOT apply breed-typical or assumed coloring. If the animal is white, keep it white. If gray, keep it gray. Copy the real colors from the photo precisely.
${haikuPrompt}`
  }

  console.log(`[generate-tattoo] Step 4 INPUT — Gemini 2.0 Flash Preview Image Generation:`)
  console.log(`  style: ${artStyle}`)
  console.log(`  model: gemini-2.0-flash-preview-image-generation`)
  console.log(`  prompt (full text):\n---\n${finalPrompt}\n---`)

  const requestBody = {
    contents: [{
      parts: [
        { inline_data: { mime_type: pet.mimeType,      data: pet.base64      } },
        { inline_data: { mime_type: styleRef.mimeType, data: styleRef.base64 } },
        { text: finalPrompt },
      ],
    }],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
    },
  }

  const t0 = Date.now()
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API failed (${res.status}): ${err}`)
  }

  const result = await res.json()
  const elapsed = Date.now() - t0
  console.log(`[generate-tattoo] Step 4 — Gemini responded in ${elapsed}ms`)

  const parts = result?.candidates?.[0]?.content?.parts ?? []
  const imagePart = parts.find((p: any) => p.inline_data?.mime_type?.startsWith('image/'))

  if (!imagePart) {
    throw new Error(`Gemini returned no image. Response: ${JSON.stringify(result).slice(0, 500)}`)
  }

  const mimeType = imagePart.inline_data.mime_type as string
  const base64 = imagePart.inline_data.data as string
  console.log(`[generate-tattoo] Step 4 OUTPUT — Gemini image: ${mimeType} (${base64.length} chars)`)
  return { base64, mimeType }
}

// ─── STEP 6: Upload Gemini output to permanent Supabase Storage ───────────────
// Note: We skip server-side BiRefNet on the Gemini output because
// BiRefNet cannot distinguish the white background from white chest/interior areas.
// Background removal is handled client-side via flood-fill.
async function uploadFinalArt(artBase64: string, mimeType: string): Promise<string> {
  const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg'
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const bytes = Uint8Array.from(atob(artBase64), c => c.charCodeAt(0))
  const filename = `finals/${Date.now()}.${ext}`

  console.log(`[generate-tattoo] Step 6 INPUT — uploading Gemini art to Storage: ${filename} (${mimeType})`)

  const { error } = await supabase.storage
    .from('pet-tattoos')
    .upload(filename, bytes, { contentType: mimeType, upsert: false })

  if (error) throw new Error(`Storage upload (finals) failed: ${error.message}`)
  const { data } = supabase.storage.from('pet-tattoos').getPublicUrl(filename)
  console.log(`[generate-tattoo] Step 6 OUTPUT — permanent art URL: ${data.publicUrl}`)
  return data.publicUrl
}

// ─── Main handler ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    if (!FALAI_API_KEY) throw new Error('FALAI_API_KEY secret not configured')
    if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY secret not configured')
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY secret not configured')

    const { imageBase64, petName, style } = await req.json()
    if (!imageBase64) throw new Error('imageBase64 is required')

    const artStyle: 'dibujo' | 'icono' = style === 'icono' ? 'icono' : 'dibujo'

    console.log(`[generate-tattoo] ═══ PIPELINE START (v22 — Gemini 2.0 Flash Image Gen) ═══`)
    console.log(`[generate-tattoo] INPUT — petName: "${petName || 'unnamed'}" | style: ${artStyle} | imageBase64 length: ${imageBase64.length}`)

    // Step 1: Remove background from user photo (fal-ai/birefnet)
    console.log('[generate-tattoo] ─── Step 1: fal-ai/birefnet background removal (user photo) ───')
    const t1 = Date.now()
    const transparentPngUrl = await removeBackgroundFal(`data:image/png;base64,${imageBase64}`, 'Step 1')
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

    // Step 4: Gemini 2.5 Flash → final art
    console.log('[generate-tattoo] ─── Step 4: gemini-2.0-flash-preview-image-generation ───')
    const t4 = Date.now()
    const { base64: artBase64, mimeType: artMimeType } = await generateWithGemini(petUrl, optimizedPrompt, artStyle)
    console.log(`[generate-tattoo] Step 4 done in ${Date.now() - t4}ms`)

    // Step 5.5 SKIPPED — BiRefNet cannot distinguish white background from white interior areas.
    // Background removal handled client-side via flood-fill.

    // Step 6: Upload Gemini art to permanent Storage
    console.log('[generate-tattoo] ─── Step 6: Upload Gemini art to permanent Storage ───')
    const t6 = Date.now()
    const permanentArtUrl = await uploadFinalArt(artBase64, artMimeType)
    console.log(`[generate-tattoo] Step 6 done in ${Date.now() - t6}ms | permanent URL: ${permanentArtUrl}`)

    const totalMs = Date.now() - t1
    console.log(`[generate-tattoo] ═══ PIPELINE COMPLETE — total time: ${totalMs}ms ═══`)
    console.log(`[generate-tattoo] FINAL OUTPUT URL: ${permanentArtUrl}`)

    return new Response(JSON.stringify({ url: permanentArtUrl }), {
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