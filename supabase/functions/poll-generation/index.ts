// poll-generation — consulta el estado de un job en generation_jobs
// GET ?job_id=<uuid>
// Returns: { status: 'processing' | 'done' | 'error' | 'not_found', result_url?, error_message? }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL             = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const url    = new URL(req.url)
    const jobId  = url.searchParams.get('job_id')

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'job_id query param is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data, error } = await supabase
      .from('generation_jobs')
      .select('status, result_url, error_message')
      .eq('id', jobId)
      .maybeSingle()

    if (error) {
      console.error('[poll-generation] DB error:', error.message)
      return new Response(
        JSON.stringify({ status: 'not_found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!data) {
      return new Response(
        JSON.stringify({ status: 'not_found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[poll-generation] job_id=${jobId} → status=${data.status}`)

    return new Response(
      JSON.stringify({
        status:        data.status,
        result_url:    data.result_url    ?? null,
        error_message: data.error_message ?? null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[poll-generation] ERROR:', message)
    return new Response(
      JSON.stringify({ status: 'not_found', error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})