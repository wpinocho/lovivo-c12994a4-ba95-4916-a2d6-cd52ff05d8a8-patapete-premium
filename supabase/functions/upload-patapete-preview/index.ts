// upload-patapete-preview — Receives a base64 PNG of the Patapete canvas preview,
// uploads it to pet-tattoos/previews/ in Supabase Storage, and returns a permanent URL.
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
    const { base64 } = await req.json()
    if (!base64) throw new Error('base64 is required')

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
    const filename = `previews/${Date.now()}.png`

    console.log(`[upload-patapete-preview] uploading to pet-tattoos/${filename}`)

    const { error } = await supabase.storage
      .from('pet-tattoos')
      .upload(filename, bytes, { contentType: 'image/png', upsert: false })

    if (error) throw new Error(`Storage upload failed: ${error.message}`)

    const { data } = supabase.storage.from('pet-tattoos').getPublicUrl(filename)
    console.log(`[upload-patapete-preview] done — URL: ${data.publicUrl}`)

    return new Response(JSON.stringify({ url: data.publicUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[upload-patapete-preview] ERROR:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})