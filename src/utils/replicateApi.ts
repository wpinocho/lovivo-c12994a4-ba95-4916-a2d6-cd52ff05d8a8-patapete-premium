/**
 * replicateApi.ts — Async job-queue architecture
 *
 * Flow:
 *  1. Client calls generateTattooArt() with a jobId (uuid)
 *  2. Edge function 'generate-tattoo' writes status='processing' to generation_jobs,
 *     runs the full pipeline (~30s), then writes status='done' + result_url.
 *  3. Client polls 'poll-generation' every 3s via SHORT HTTP calls (~1s each).
 *     iOS can kill the long HTTP connection, but the server keeps cooking independently.
 *  4. When poll finds status='done' → returns the URL.
 *
 * resumePollingForJob() lets us re-attach to an in-flight job after the app
 * was backgrounded without calling generate-tattoo again.
 */

import { userSupabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/client'
import type { Style } from '@/components/patapete/configurator/types'

export type TattooProgressCallback = (status: string) => void

// ─── Constants ────────────────────────────────────────────────────────────────
const FUNCTIONS_URL  = `${SUPABASE_URL}/functions/v1`
const ANON_KEY       = SUPABASE_PUBLISHABLE_KEY
const POLL_INTERVAL  = 3000  // ms between polls
const POLL_MAX       = 80    // 80 × 3s = ~4 minutes max

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

/** Single poll call → { status, result_url?, error_message? } */
async function pollOnce(jobId: string): Promise<{ status: string; result_url?: string; error_message?: string }> {
  const res = await fetch(`${FUNCTIONS_URL}/poll-generation?job_id=${jobId}`, {
    headers: {
      'Authorization': `Bearer ${ANON_KEY}`,
      'apikey': ANON_KEY,
    },
  })
  if (!res.ok) return { status: 'not_found' }
  return res.json()
}

/** Poll until done, error, or timeout. Used by both fresh generate and resume. */
async function waitForJob(
  jobId: string,
  onProgress?: TattooProgressCallback
): Promise<string> {
  const progressMessages = [
    'Analizando tu mascota...',
    'Detectando rasgos únicos...',
    'Capturando la personalidad...',
    'Pintando el retrato...',
    '¡Casi listo! ✨',
  ]
  let msgIndex = 0

  for (let attempt = 0; attempt < POLL_MAX; attempt++) {
    await sleep(POLL_INTERVAL)

    // Cycle progress messages ~every 15s (every 5 polls)
    const newMsgIndex = Math.min(Math.floor(attempt / 5), progressMessages.length - 1)
    if (newMsgIndex !== msgIndex) {
      msgIndex = newMsgIndex
      onProgress?.(progressMessages[msgIndex])
    }

    let data: { status: string; result_url?: string; error_message?: string }
    try {
      data = await pollOnce(jobId)
    } catch {
      // Network error — keep trying
      continue
    }

    if (data.status === 'done' && data.result_url) {
      return data.result_url
    }

    if (data.status === 'error') {
      throw new Error(data.error_message || 'Error generando imagen')
    }

    // 'processing' | 'not_found' → keep polling
  }

  throw new Error('Tiempo de espera agotado. Por favor inténtalo de nuevo.')
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Start a new generation.
 * - Fires the HTTP call to generate-tattoo (doesn't await response — server continues even if connection dies)
 * - Polls every 3s via short HTTP calls until the job is done
 */
export async function generateTattooArt(
  imageBase64: string,
  petName: string,
  style: Style,
  jobId: string,
  onProgress?: TattooProgressCallback
): Promise<string> {
  onProgress?.('Analizando tu mascota...')

  // Fire the generation request — don't await the response.
  // The server will run the full pipeline and update generation_jobs when done.
  // If the HTTP connection dies (iOS background), the server keeps going.
  userSupabase.functions.invoke('generate-tattoo', {
    body: { imageBase64, petName, style, jobId },
  }).catch((err) => {
    // Swallow connection errors — result will come via polling
    console.warn('[replicateApi] generate-tattoo HTTP connection lost (expected on mobile):', err?.message)
  })

  // Wait ~3s for the server to write 'processing' to DB before first poll
  await sleep(3000)

  return waitForJob(jobId, onProgress)
}

/**
 * Resume polling for an existing job (server already processing — don't call generate-tattoo again).
 * Use this when the app returns from background and we know the job is still 'processing'.
 */
export async function resumePollingForJob(
  jobId: string,
  onProgress?: TattooProgressCallback
): Promise<string> {
  onProgress?.('Retomando generación...')
  return waitForJob(jobId, onProgress)
}

/**
 * One-shot status check — returns current job status without polling.
 * Use in auto-retry logic to decide whether to resume or start fresh.
 */
export async function checkJobStatus(
  jobId: string
): Promise<{ status: string; result_url?: string; error_message?: string }> {
  try {
    return await pollOnce(jobId)
  } catch {
    return { status: 'not_found' }
  }
}