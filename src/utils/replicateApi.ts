/**
 * Calls Replicate API to generate tattoo-style art from a pet photo.
 * Requires VITE_REPLICATE_API_KEY to be set.
 *
 * Model: black-forest-labs/flux-schnell (img2img)
 * Cost: ~$0.003 per image
 */

const REPLICATE_API_KEY = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_REPLICATE_API_KEY) || ''

export type TattooProgressCallback = (status: string) => void

export async function generateTattooArt(
  imageBase64: string,
  petName: string,
  onProgress?: TattooProgressCallback
): Promise<string> {
  if (!REPLICATE_API_KEY) {
    throw new Error('VITE_REPLICATE_API_KEY no está configurado. Contacta al administrador de la tienda.')
  }

  onProgress?.('Enviando imagen a la IA...')

  const prompt = `tattoo art style portrait of a ${petName || 'pet'}, fine line botanical tattoo, black ink on white, detailed stippling, elegant botanical decorations, wreath frame, high contrast, professional tattoo flash sheet style`

  // Convert base64 dataURL to blob URL for Replicate
  const imageUrl = imageBase64 // Replicate accepts data URLs

  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${REPLICATE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: '5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637', // flux-schnell
      input: {
        image: imageUrl,
        prompt,
        go_fast: true,
        guidance: 3.5,
        num_outputs: 1,
        aspect_ratio: '1:1',
        output_format: 'png',
        output_quality: 90,
        num_inference_steps: 4,
      },
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(`Error de la API: ${err.detail || response.statusText}`)
  }

  const prediction = await response.json()
  const predictionId = prediction.id

  onProgress?.('Generando arte... esto toma ~30 segundos')

  // Poll for result
  for (let attempt = 0; attempt < 60; attempt++) {
    await new Promise(r => setTimeout(r, 1500))

    const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { 'Authorization': `Token ${REPLICATE_API_KEY}` },
    })

    const result = await pollResponse.json()

    if (result.status === 'succeeded') {
      onProgress?.('¡Arte generado!')
      const outputUrl = result.output?.[0]
      if (!outputUrl) throw new Error('No se recibió imagen de la IA')
      return outputUrl
    }

    if (result.status === 'failed') {
      throw new Error(result.error || 'La generación de IA falló')
    }

    const elapsed = ((attempt + 1) * 1.5).toFixed(0)
    onProgress?.(`Generando arte... ${elapsed}s`)
  }

  throw new Error('Tiempo de espera agotado. Intenta de nuevo.')
}