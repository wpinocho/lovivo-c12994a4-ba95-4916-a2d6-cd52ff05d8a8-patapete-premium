# Patapete — Plan de mejora de conversión

## Estado actual
- Tienda activa con campaña de Meta en curso
- 0% conversión en móvil (100% del tráfico de Meta)
- Pipeline de IA: BiRefNet (Fal) → Normalización → Claude Haiku → **Gemini 2.5 Flash Image (stable)**

## Pipeline actual (v24)
1. **Step 1:** `fal-ai/birefnet` — background removal (foto usuario)
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
7. **🔥 FIRE AND FORGET:** Insert a `generation_logs` sin await — cero latencia agregada

## Historial de modelos probados
- `gemini-2.5-flash-preview-04-17` → 404 (modelo de texto, no genera imágenes)
- `gemini-2.0-flash-preview-image-generation` → funcionaba pero deprecado
- `gemini-2.5-flash-preview-image` → 404 (nombre incorrecto, orden erróneo)
- `gemini-2.5-flash-image` → **CORRECTO** (stable, doc oficial: ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-image)

## Notas críticas del modelo
- Nombre estable: `gemini-2.5-flash-image`
- Nombre deprecado: `gemini-2.5-flash-image-preview`
- Alias: "Nano Banana"
- Última actualización: October 2025
- Input token limit: 65,536 | Output token limit: 32,768
- **Respuesta usa camelCase:** `inlineData.mimeType` y `inlineData.data` (NO snake_case)

## Tabla generation_logs ✅ IMPLEMENTADA
- Migración: `supabase/migrations/20260324012833_create_generation_logs.sql`
- Columnas: `id`, `created_at`, `pet_name`, `style`, `haiku_input_prompt`, `haiku_output_prompt`, `gemini_prompt`, `gemini_output_url`, `latency_birefnet_ms`, `latency_haiku_ms`, `latency_gemini_ms`, `latency_total_ms`
- **Estrategia fire-and-forget:** insert sin `await` antes del `return new Response(...)` → cero latencia agregada al usuario
- `latency_total_ms` mide desde `tStart` (inicio del handler) hasta antes del return
- `generateWithGemini` ahora retorna `{ base64, mimeType, promptUsed }` para capturar el prompt exacto enviado a Gemini (sin las imágenes en base64)

## Próximos pasos pendientes
- Probar con diferentes razas/colores para verificar calidad Gemini 2.5
- Monitorear logs step 4: tiempo de respuesta
- Revisar tabla `generation_logs` en Supabase Dashboard para validar que el insert funciona

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