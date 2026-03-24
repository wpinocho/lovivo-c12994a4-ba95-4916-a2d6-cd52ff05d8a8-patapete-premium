# Patapete — Plan de mejora de conversión

## Estado actual
- Tienda activa con campaña de Meta en curso
- 0% conversión en móvil (100% del tráfico de Meta)
- Pipeline de IA: BiRefNet (Fal) → Normalización → Claude Haiku → **Gemini 2.5 Flash Preview Image**

## Pipeline actual (v23)
1. **Step 1:** `fal-ai/birefnet` — background removal (foto usuario)
2. **Step 2:** Smart crop + normalize 800×800 canvas blanco (imagescript)
3. **Step 2.5:** Upload pet normalizado a Supabase Storage → URL pública
4. **Step 3:** Claude Haiku 4.5 → genera prompt optimizado según estilo
5. **Step 4:** Google Gemini `gemini-2.5-flash-preview-image`
   - Endpoint: `v1beta/models/gemini-2.5-flash-preview-image:generateContent`
   - Imágenes pasadas como `inline_data` (base64, no URLs)
   - `responseModalities: ['IMAGE', 'TEXT']` (ambos requeridos)
   - Responde con imagen en `candidates[0].content.parts[].inline_data` o `inlineData`
   - Sin cola / sin polling — respuesta directa
6. **Step 6:** Upload Gemini output a Supabase Storage → URL permanente

## Cambios aplicados (v23)
- Modelo: `gemini-2.0-flash-preview-image-generation` → `gemini-2.5-flash-preview-image`
- Endpoint actualizado acorde al nuevo modelo

## Cambios anteriores (v22)
- Fix crítico: modelo `gemini-2.5-flash-preview-04-17` → `gemini-2.0-flash-preview-image-generation`
- responseModalities cambiado de `['IMAGE']` a `['IMAGE', 'TEXT']`

## Próximos pasos pendientes
- Probar con diferentes razas/colores para verificar calidad Gemini 2.5
- Monitorear logs step 4: tiempo de respuesta
- Verificar calidad vs versión anterior

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
- **IMPORTANTE:** gemini-2.5-flash NO genera imágenes — usar `gemini-2.5-flash-preview-image`