/**
 * Calls the Supabase Edge Function 'generate-tattoo' which runs the full pipeline:
 *   1. BiRefNet background removal (Replicate)
 *   2. Smart crop & normalize to 800×800 white canvas (imagescript)
 *   3. FLUX Dev img2img stylization (Replicate)
 *
 * Accepts the ORIGINAL compressed image (no browser-side bg removal needed).
 * Uses the USER's own Supabase project (vqmqdhsajdldsraxsqba).
 */

import { userSupabase } from '@/integrations/supabase/client'

export type TattooProgressCallback = (status: string) => void

export async function generateTattooArt(
  imageBase64: string,
  petName: string,
  onProgress?: TattooProgressCallback
): Promise<string> {
  onProgress?.('Analizando tu mascota...')

  try {
    // Progress hints while the backend works (~35-50s total)
    const progressTimer = simulateProgress(onProgress)

    const { data, error } = await userSupabase.functions.invoke('generate-tattoo', {
      body: { imageBase64, petName },
    })

    clearInterval(progressTimer)

    if (error) {
      throw new Error(error.message || 'Error en generate-tattoo')
    }

    if (data?.error) {
      throw new Error(data.error)
    }

    if (!data?.url) {
      throw new Error('No se recibió imagen de la IA')
    }

    onProgress?.('¡Retrato listo!')
    return data.url
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    throw new Error(message)
  }
}

/** Cycles through friendly progress messages while the backend processes */
function simulateProgress(onProgress?: TattooProgressCallback): ReturnType<typeof setInterval> {
  const messages = [
    { delay: 0,     text: 'Analizando tu mascota...' },
    { delay: 5000,  text: 'Recortando fondo con IA...' },
    { delay: 14000, text: 'Encuadrando y normalizando...' },
    { delay: 20000, text: 'Creando retrato artístico... (~30s)' },
    { delay: 40000, text: 'Casi listo...' },
  ]

  let msgIndex = 0
  const start = Date.now()

  return setInterval(() => {
    const elapsed = Date.now() - start
    // Advance to the next message if its delay has passed
    while (msgIndex < messages.length - 1 && elapsed >= messages[msgIndex + 1].delay) {
      msgIndex++
    }
    onProgress?.(messages[msgIndex].text)
  }, 3000)
}