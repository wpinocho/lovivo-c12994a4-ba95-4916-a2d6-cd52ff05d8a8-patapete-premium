// v3
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_KEY secret not configured')
    }

    const { imageBase64, petName } = await req.json()

    if (!imageBase64) {
      throw new Error('imageBase64 is required')
    }

    const prompt = `fine line black ink tattoo art portrait of a ${petName || 'pet'}, botanical wreath frame, stippling details, elegant botanical decorations, high contrast black and white, professional tattoo flash sheet style, white background`

    // Start prediction on Replicate
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: '5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637',
        input: {
          image: imageBase64,
          prompt,
          go_fast: true,
          guidance: 3.5,
          num_outputs: 1,
          aspect_ratio: '1:1',
          output_format: 'webp',
          output_quality: 90,
          num_inference_steps: 4,
        },
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(`Replicate error: ${err.detail || response.statusText}`)
    }

    const prediction = await response.json()

    // Poll for result (max 90s = 60 × 1500ms)
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 1500))

      const poll = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { 'Authorization': `Token ${REPLICATE_API_KEY}` },
      })
      const result = await poll.json()

      if (result.status === 'succeeded') {
        const url = result.output?.[0]
        if (!url) throw new Error('No image URL in response')
        return new Response(JSON.stringify({ url }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (result.status === 'failed') {
        throw new Error(result.error || 'Generation failed')
      }
    }

    throw new Error('Timeout: generation took too long')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})