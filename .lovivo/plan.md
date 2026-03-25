# Patapete — Plan de mejora de conversión

## Estado actual
- Tienda activa con campaña de Meta en curso
- Pipeline de IA: BiRefNet (Fal) → Normalización → Claude Haiku → **Gemini 2.5 Flash Image (stable)**
- Bug "Ordenar ahora → carrito vacío" ✅ CORREGIDO
- Auto-retry generación IA al montar ✅ IMPLEMENTADO
- **Async Job Queue (anti-loop móvil) ✅ IMPLEMENTADO (v25)**
- **Bug thumbnail rota + remove background ✅ CORREGIDO (v26)**

## Pipeline actual (v24)
1. **Step 0.5 + Step 1 (paralelo):** Upload imagen original usuario a Storage (`user-uploads/`) + `fal-ai/birefnet` — background removal (foto usuario) → corren en `Promise.all` para cero latencia extra
2. **Step 2:** Smart crop + normalize 800×800 canvas blanco (imagescript)
3. **Step 2.5:** Upload pet normalizado a Supabase Storage → URL pública
4. **Step 3:** Claude Haiku 4.5 → genera prompt optimizado según estilo
5. **Step 4:** Google Gemini `gemini-2.5-flash-image` (**stable, "Nano Banana"**)
6. **Step 6:** Upload Gemini output a Supabase Storage → URL permanente
7. **🔥 FIRE AND FORGET:** Insert a `generation_logs` sin await — cero latencia agregada al usuario

## ✅ Arquitectura Async Job Queue (v25 — IMPLEMENTADA)

### Tabla generation_jobs
- `id` (uuid PK), `status` (processing/done/error), `result_url`, `error_message`, `style`, `pet_name`, `created_at`, `updated_at`
- RLS: public SELECT, service role escribe

## ✅ Fix thumbnail + remove background (v26)

### Root cause
`PhotoPetForm.tsx` línea 141 cargaba `pet.generatedArtUrl` sin `crossOrigin` en el thumbnail → envenenaba caché del browser → `CanvasPreview` no podía hacer flood-fill (SecurityError).

### Fix aplicado
- Thumbnail ahora SIEMPRE muestra `pet.photoPreviewUrl` (foto original del usuario)
- `CanvasPreview` recibe la URL generada limpia → flood-fill funciona correctamente
- Sin badge "✓ Listo" (el usuario no lo quiso)

---

## Notas técnicas
- PostHog en modo `identified_only` — eventos anónimos visibles en "Events", no en "Activity"
- User's Supabase: `vqmqdhsajdldsraxsqba`
- Edge functions via `userSupabase.functions.invoke()` desde `src/integrations/supabase/client.ts`
- FALAI_API_KEY aún necesaria para BiRefNet (step 1)
- GEMINI_API_KEY para step 4 (ya configurada)
- ANTHROPIC_API_KEY para step 3 (Haiku)

## ✅ Bug "Ordenar ahora" → checkout vacío — RESUELTO
- Fix en `PatapeteConfigurator.tsx`: si order_items vacío → updateCheckout con include_product_details

## Tabla generation_logs ✅ COMPLETA
- Columnas completas: `id`, `created_at`, `pet_name`, `style`, `status`, `error_message`, `user_image_url`, `pet_normalized_url`, `haiku_input_prompt`, `haiku_output_prompt`, `gemini_prompt`, `gemini_output_url`, `latency_birefnet_ms`, `latency_haiku_ms`, `latency_gemini_ms`, `latency_total_ms`