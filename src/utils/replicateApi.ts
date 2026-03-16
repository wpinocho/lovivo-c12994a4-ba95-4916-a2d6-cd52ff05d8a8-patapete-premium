/**
 * Calls the Supabase Edge Function 'generate-tattoo' which runs the full pipeline:
 *   1. BiRefNet background removal (Replicate)
 *   2. Smart crop & normalize to 800×800 white canvas (imagescript)
 *   3. Llama 3.2 Vision (Replicate) → generates optimized prompt based on style
 *   4. FLUX 2 Pro img2img stylization (Replicate)
 *
 * Accepts the ORIGINAL compressed image (no browser-side bg removal needed).
 * Uses the USER's own Supabase project (vqmqdhsajdldsraxsqba).
 */

import { userSupabase } from '@/integrations/supabase/client'
import type { Style } from '@/components/patapete/configurator/types'

export type TattooProgressCallback = (status: string) => void

export async function generateTattooArt(
  imageBase64: string,
  petName: string,
  style: Style,
  onProgress?: TattooProgressCallback
): Promise<string> {
  onProgress?.('Analizando tu mascota...')

  try {
    const progressTimer = simulateProgress(onProgress)

    const { data, error } = await userSupabase.functions.invoke('generate-tattoo', {
      body: { imageBase64, petName, style },
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
    { delay: 4000,  text: 'Detectando rasgos únicos...' },
    { delay: 9000,  text: 'Capturando la personalidad...' },
    { delay: 14000, text: 'Pintando el retrato...' },
    { delay: 18000, text: '¡Casi listo! ✨' },
  ]

  let msgIndex = 0
  const start = Date.now()

  return setInterval(() => {
    const elapsed = Date.now() - start
    while (msgIndex < messages.length - 1 && elapsed >= messages[msgIndex + 1].delay) {
      msgIndex++
    }
    onProgress?.(messages[msgIndex].text)
  }, 3000)
}