# Patapete — Plan de mejora de conversión

## Estado actual
- Tienda activa con campaña de Meta en curso
- 0% conversión en móvil (100% del tráfico de Meta)
- Pipeline de IA: BiRefNet (Fal) → Normalización → Claude Haiku → **Gemini 2.5 Flash**

## Pipeline actual (v21)
1. **Step 1:** `fal-ai/birefnet` — background removal (foto usuario)
2. **Step 2:** Smart crop + normalize 800×800 canvas blanco (imagescript)
3. **Step 2.5:** Upload pet normalizado a Supabase Storage → URL pública
4. **Step 3:** Claude Haiku 4.5 → genera prompt optimizado según estilo
5. **Step 4:** Google Gemini 2.5 Flash (`gemini-2.5-flash-preview-04-17`) → arte final
   - Imágenes pasadas como `inline_data` (base64, no URLs)
   - Responde con imagen en `candidates[0].content.parts[].inline_data`
   - Sin cola / sin polling — respuesta directa
6. **Step 6:** Upload Gemini output a Supabase Storage → URL permanente

## Cambios aplicados (2026-03-23) — v21
- **Migración Step 4:** Fal.ai FLUX 2 Pro → Google Gemini 2.5 Flash directo
- **Nuevo helper:** `urlToBase64()` — fetch URL → base64 chunked (evita stack overflow)
- **`generateWithGemini()`:** Las 2 imágenes se pasan como `inline_data` en `contents[].parts`
- **`uploadFinalArt()`:** Ahora recibe `(base64, mimeType)` en vez de URL — detecta extensión automáticamente
- **Secret requerido:** `GEMINI_API_KEY` (ya agregado por el usuario)

## Cambios anteriores (2026-03-23) — v20
- Modelo Haiku: `claude-3-haiku-20240307` → `claude-haiku-4-5`
- SYSTEM_PROMPT_ICONO reescrito v3: sin raza, colores exactos de imagen, línea delgada
- Prompt a Flux: regla crítica de color (ahora adaptado a Gemini)

## Próximos pasos pendientes
- Probar con diferentes razas/colores para verificar calidad Gemini
- Monitorear logs step 4: tiempo de respuesta de Gemini vs FLUX anterior
- Verificar que el mime_type del response de Gemini es manejado correctamente

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