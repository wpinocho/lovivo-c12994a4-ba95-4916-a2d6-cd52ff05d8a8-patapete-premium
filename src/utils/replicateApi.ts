/**
 * Calls the Supabase Edge Function 'generate-tattoo' which securely proxies
 * Replicate API calls using the REPLICATE_API_KEY server-side secret.
 *
 * Uses the USER's own Supabase project (vqmqdhsajdldsraxsqba), NOT Lovivo's shared Supabase.
 *
 * Model: black-forest-labs/flux-schnell (img2img)
 * Cost: ~$0.003 per image
 */

import { userSupabase } from '@/integrations/supabase/client'

export type TattooProgressCallback = (status: string) => void

export async function generateTattooArt(
  imageBase64: string,
  petName: string,
  onProgress?: TattooProgressCallback
): Promise<string> {
  onProgress?.('Enviando imagen a la IA...')

  try {
    const { data, error } = await userSupabase.functions.invoke('generate-tattoo', {
      body: { imageBase64, petName },
    })

    if (error) {
      throw new Error(error.message || 'Error en generate-tattoo')
    }

    if (data?.error) {
      throw new Error(data.error)
    }

    if (!data?.url) {
      throw new Error('No se recibió imagen de la IA')
    }

    onProgress?.('¡Arte generado!')
    return data.url
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    throw new Error(message)
  }
}