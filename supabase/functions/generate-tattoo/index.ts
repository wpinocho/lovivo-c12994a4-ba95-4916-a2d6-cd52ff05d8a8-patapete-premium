// v5 — BiRefNet bg removal + imagescript smart crop + FLUX Dev img2img
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Image } from 'https://deno.land/x/imagescript@1.2.15/mod.ts'

const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── Shared: poll Replicate until done ────────────────────────────────────────
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
// Model: zhengpeng7/birefnet on Replicate
// Returns a CDN URL to a PNG with transparent background
async function removeBackgroundBiRefNet(imageBase64: string): Promise<string> {
  const response = await fetch('https://api.replicate.com/v1/models/zhengpeng7/birefnet/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${REPLICATE_API_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'wait=55', // try synchronous first (BiRefNet is fast ~5-15s)
    },
    body: JSON.stringify({
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

  // Synchronous result (Prefer: wait worked)
  if (prediction.status === 'succeeded') {
    const out = prediction.output
    const url = Array.isArray(out) ? out[0] : out
    if (!url) throw new Error('BiRefNet returned empty output')
    return url
  }

  // Async — need to poll
  const result = await pollReplicate(prediction.id, 60)
  const out = result.output
  const url = Array.isArray(out) ? out[0] : out
  if (!url) throw new Error('BiRefNet returned empty output after polling')
  return url
}

// ─── STEP 2: Smart crop & normalize → 800×800 white canvas ───────────────────
// Downloads the transparent PNG, finds the subject bounding box, expands it with
// body-framing padding, scales to ~75% of canvas height, and centers on white BG.
async function normalizeImage(transparentPngUrl: string): Promise<string> {
  const res = await fetch(transparentPngUrl)
  if (!res.ok) throw new Error(`Failed to download BiRefNet output: ${res.status}`)
  const bytes = new Uint8Array(await res.arrayBuffer())
  const img = await Image.decode(bytes)

  // Find bounding box of non-transparent pixels (imagescript is 1-indexed)
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

  // Convert to 0-indexed
  const subjectX0 = minX - 1
  const subjectY0 = minY - 1
  const subjectW = maxX - minX + 1
  const subjectH = maxY - minY + 1

  // Expand box: 20% sides, 10% top, 40% bottom (captures head + upper chest)
  const padSide   = Math.round(subjectW * 0.20)
  const padTop    = Math.round(subjectH * 0.10)
  const padBottom = Math.round(subjectH * 0.40)

  const cropX = Math.max(0, subjectX0 - padSide)
  const cropY = Math.max(0, subjectY0 - padTop)
  const cropW = Math.min(img.width  - cropX, subjectW + padSide   * 2)
  const cropH = Math.min(img.height - cropY, subjectH + padTop + padBottom)

  img.crop(cropX, cropY, cropW, cropH)

  // Scale so subject height fills ~75% of the 800px target
  const targetSize = 800
  const scale  = (targetSize * 0.75) / img.height
  const scaledW = Math.max(1, Math.round(img.width  * scale))
  const scaledH = Math.max(1, Math.round(img.height * scale))
  img.resize(scaledW, scaledH)

  // Create 800×800 white canvas and center the pet
  const canvas = new Image(targetSize, targetSize)
  canvas.fill(0xFFFFFFFF) // white, fully opaque

  const offsetX = Math.round((targetSize - scaledW) / 2)
  const offsetY = Math.round((targetSize - scaledH) / 2)
  canvas.composite(img, offsetX, offsetY)

  // Encode to PNG → base64
  const encoded = await canvas.encode()
  let binary = ''
  for (let i = 0; i < encoded.length; i++) {
    binary += String.fromCharCode(encoded[i])
  }
  return btoa(binary)
}

// ─── STEP 3: FLUX Dev img2img stylization ────────────────────────────────────
// Uses black-forest-labs/flux-dev via the models API (always latest version)
const PROMPT = [
  'A clean minimalist line art illustration of this exact pet,',
  'designed for laser engraving on a natural fiber doormat.',
  'Bold dark brown linework on a solid white background.',
  'Elegant confident outlining, minimal shading, high contrast.',
  'Product-ready illustration, premium home decor aesthetic.',
  'The pet fills most of the frame, facing forward.',
].join(' ')

async function generateWithFluxDev(normalizedBase64: string): Promise<string> {
  const response = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-dev/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${REPLICATE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: {
        prompt: PROMPT,
        image: `data:image/png;base64,${normalizedBase64}`,
        prompt_strength: 0.78,  // 78% text → stylize heavily; 22% image → keep identity
        num_inference_steps: 28,
        guidance: 3.5,
        num_outputs: 1,
        output_format: 'webp',
        output_quality: 92,
        disable_safety_checker: true,
      },
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(`FLUX Dev error: ${JSON.stringify(err)}`)
  }

  const prediction = await response.json()
  if (!prediction.id) throw new Error(`FLUX Dev: no prediction ID in response`)

  // Poll up to 2 minutes
  const result = await pollReplicate(prediction.id, 120)
  const out = result.output
  const url = Array.isArray(out) ? out[0] : out
  if (!url) throw new Error('FLUX Dev returned no image URL')
  return url
}

// ─── Main handler ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    if (!REPLICATE_API_KEY) throw new Error('REPLICATE_API_KEY secret not configured')

    const { imageBase64, petName } = await req.json()
    if (!imageBase64) throw new Error('imageBase64 is required')

    console.log(`[generate-tattoo] Starting pipeline for pet: "${petName || 'unnamed'}"`)

    // 1. Remove background
    console.log('[generate-tattoo] Step 1: BiRefNet background removal...')
    const transparentPngUrl = await removeBackgroundBiRefNet(imageBase64)
    console.log('[generate-tattoo] Step 1 done:', transparentPngUrl)

    // 2. Smart crop + normalize
    console.log('[generate-tattoo] Step 2: Smart crop & normalize...')
    const normalizedBase64 = await normalizeImage(transparentPngUrl)
    console.log('[generate-tattoo] Step 2 done: normalized 800×800 PNG')

    // 3. FLUX Dev stylization
    console.log('[generate-tattoo] Step 3: FLUX Dev img2img...')
    const artUrl = await generateWithFluxDev(normalizedBase64)
    console.log('[generate-tattoo] Step 3 done:', artUrl)

    return new Response(JSON.stringify({ url: artUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[generate-tattoo] Error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})