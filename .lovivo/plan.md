# Patapete — Plan de mejora de conversión

## Estado actual
- Tienda activa con campaña de Meta en curso
- Pipeline de IA: BiRefNet (Fal) → Normalización → Claude Haiku → **Gemini 2.5 Flash Image (stable)**
- Bug "Ordenar ahora → carrito vacío" ✅ CORREGIDO
- Auto-retry generación IA al montar ✅ IMPLEMENTADO
- **Async Job Queue (anti-loop móvil) ✅ IMPLEMENTADO (v25)**

## Pipeline actual (v24)
1. **Step 0.5 + Step 1 (paralelo):** Upload imagen original usuario a Storage (`user-uploads/`) + `fal-ai/birefnet` — background removal (foto usuario) → corren en `Promise.all` para cero latencia extra
2. **Step 2:** Smart crop + normalize 800×800 canvas blanco (imagescript)
3. **Step 2.5:** Upload pet normalizado a Supabase Storage → URL pública
4. **Step 3:** Claude Haiku 4.5 → genera prompt optimizado según estilo
5. **Step 4:** Google Gemini `gemini-2.5-flash-image` (**stable, "Nano Banana"**)
   - Endpoint: `v1beta/models/gemini-2.5-flash-image:generateContent`
   - Imágenes pasadas como `inline_data` (base64, no URLs)
   - `responseModalities: ['IMAGE', 'TEXT']` (ambos requeridos)
   - **BUG CORREGIDO:** Gemini responde con camelCase `inlineData.mimeType` pero código buscaba snake_case `inline_data.mime_type` → fix: buscar ambos formatos
   - Responde con imagen en `candidates[0].content.parts[].inlineData` (camelCase)
   - Sin cola / sin polling — respuesta directa
6. **Step 6:** Upload Gemini output a Supabase Storage → URL permanente
7. **🔥 FIRE AND FORGET:** Insert a `generation_logs` sin await — cero latencia agregada al usuario

## ✅ Arquitectura Async Job Queue (v25 — IMPLEMENTADA)

### Problema resuelto
El auto-retry v1 resolvía UNA reconexión pero no el loop "salgo-vuelvo-salgo-vuelvo" en iOS.

### Solución implementada
Short Polling: el cliente manda la foto y recibe un job_id, el servidor procesa de forma independiente, el cliente hace polling cada 3s con requests cortos (~1s). Aunque iOS mate la conexión larga, el servidor sigue cocinando.

### Archivos modificados/creados
| Archivo | Acción |
|---------|--------|
| `supabase/migrations/20260325150147_create_generation_jobs.sql` | CREADA (DB) |
| `supabase/functions/generate-tattoo/index.ts` | MODIFICADO (acepta jobId, actualiza generation_jobs) |
| `supabase/functions/poll-generation/index.ts` | CREADA |
| `supabase/config.toml` | MODIFICADO (añadido poll-generation) |
| `src/utils/replicateApi.ts` | REESCRITO (async job queue + polling) |
| `src/components/patapete/configurator/types.ts` | MODIFICADO (jobId en Pet + DEFAULT_PET) |
| `src/components/patapete/configurator/PatapeteConfigurator.tsx` | MODIFICADO (smart resume logic) |

### Tabla generation_jobs
- `id` (uuid PK), `status` (processing/done/error), `result_url`, `error_message`, `style`, `pet_name`, `created_at`, `updated_at`
- RLS: public SELECT (anónimos pueden leer su propio job por ID), service role escribe

### Flujo técnico
1. `handleGenerate` genera `crypto.randomUUID()` → lo guarda en pet state (persiste en localStorage)
2. `generateTattooArt(base64, petName, style, jobId, onProgress)`:
   - Dispara `userSupabase.functions.invoke('generate-tattoo', { jobId })` — NO await response (swallows connection errors)
   - Espera 3s para que el servidor escriba 'processing' en DB
   - Llama `waitForJob(jobId)` → polling cada 3s con requests directos al endpoint `poll-generation`
3. `generate-tattoo` edge function:
   - Al inicio: `upsert generation_jobs { id: jobId, status: 'processing' }` (await)
   - Al terminar: `update generation_jobs { status: 'done', result_url }` (await)
   - En error: `update generation_jobs { status: 'error' }` (fire-and-forget)
4. Smart resume al recargar (useEffect mount):
   - Pet con jobId: `checkJobStatus(jobId)` (una sola poll)
     - `done` → mostrar resultado al instante (sin re-generar)
     - `processing` → `resumePollingForJob(jobId)` (solo polling, sin nueva llamada al pipeline)
     - `error/not_found` → `handleGenerate(i)` con nuevo jobId
   - Pet sin jobId → `handleGenerate(i)` normal

### Funciones exportadas de replicateApi.ts
- `generateTattooArt(base64, petName, style, jobId, onProgress)` — inicia nueva generación
- `resumePollingForJob(jobId, onProgress)` — reanuda polling de job existente
- `checkJobStatus(jobId)` — consulta única del estado

### URLs para polling (fetch directo, no userSupabase.functions.invoke)
- `https://vqmqdhsajdldsraxsqba.supabase.co/functions/v1/poll-generation?job_id=<uuid>`
- Headers: `Authorization: Bearer <ANON_KEY>`, `apikey: <ANON_KEY>`
- ANON_KEY importado de `src/integrations/supabase/client.ts` como `SUPABASE_PUBLISHABLE_KEY`

---

## ✅ Fix implementado: imágenes de personas (no mascota)
- Haiku ahora tiene instrucción al final de ambos prompts para tratar humanos como sujetos válidos

## Tabla generation_logs ✅ COMPLETA
- Migración original: `supabase/migrations/20260324012833_create_generation_logs.sql`
- Columnas completas: `id`, `created_at`, `pet_name`, `style`, `status`, `error_message`, `user_image_url`, `pet_normalized_url`, `haiku_input_prompt`, `haiku_output_prompt`, `gemini_prompt`, `gemini_output_url`, `latency_birefnet_ms`, `latency_haiku_ms`, `latency_gemini_ms`, `latency_total_ms`

## Historial de modelos probados
- `gemini-2.5-flash-image` → **CORRECTO** (stable, doc oficial: ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-image)

## Eventos de PostHog implementados
- `photo_uploaded`, `icon_generated`, `configurator_add_to_cart`, `configurator_order_now`
- Archivos: `PhotoPetForm.tsx` y `PatapeteConfigurator.tsx`

## Notas técnicas
- PostHog en modo `identified_only` — eventos anónimos visibles en "Events", no en "Activity"
- User's Supabase: `vqmqdhsajdldsraxsqba`
- Edge functions via `userSupabase.functions.invoke()` desde `src/integrations/supabase/client.ts`
- Meta Pixel: eventos custom (`photo_uploaded`, `icon_generated`) deben usar `trackCustom` en vez de `track`
- FALAI_API_KEY aún necesaria para BiRefNet (step 1)
- GEMINI_API_KEY para step 4 (ya configurada)
- ANTHROPIC_API_KEY para step 3 (Haiku)

## ✅ Bug "Ordenar ahora" → checkout vacío — RESUELTO
- Fix en `PatapeteConfigurator.tsx`: si order_items vacío → updateCheckout con include_product_details