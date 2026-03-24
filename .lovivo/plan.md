# Patapete — Plan de mejora de conversión

## Estado actual
- Tienda activa con campaña de Meta en curso
- 0% conversión en móvil (100% del tráfico de Meta)
- Pipeline de IA: BiRefNet (Fal) → Normalización → Claude Haiku → **Gemini 2.5 Flash Image (stable)**

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

## ✅ Fix implementado: imágenes de personas (no mascota)
- Haiku ahora tiene instrucción al final de ambos prompts para tratar humanos como sujetos válidos
- `SYSTEM_PROMPT_ICONO`: NOTE al final → usa "person" como tipo, cabello = fur texture, colores de piel/ropa = main colors
- `SYSTEM_PROMPT_DIBUJO`: NOTE al final → usa "person" + rasgos estructurales equivalentes
- Cambio mínimo: 2 líneas de texto, sin tocar nada más del pipeline
- Gemini acepta "person" perfectamente y genera retratos en estilo flat vector / linocut

## Tabla generation_logs ✅ COMPLETA
- Migración original: `supabase/migrations/20260324012833_create_generation_logs.sql`
- Migración columnas imagen: `supabase/migrations/20260324152816_add_image_urls_to_generation_logs.sql`
- Migración status/error: `supabase/migrations/20260324194609_add_status_and_error_to_generation_logs.sql`
- Columnas completas:
  - `id`, `created_at`
  - `pet_name`, `style`
  - **`status`** — 'success' | 'error' (default 'success')
  - **`error_message`** — mensaje de error si status='error' (nullable)
  - **`user_image_url`** — foto original del usuario en Storage (`user-uploads/`)
  - **`pet_normalized_url`** — pet tras BiRefNet + normalización 800×800 (step 2.5, `petUrl`)
  - `haiku_input_prompt`, `haiku_output_prompt`, `gemini_prompt`, `gemini_output_url`
  - `latency_birefnet_ms`, `latency_haiku_ms`, `latency_gemini_ms`, `latency_total_ms`
- **Estrategia fire-and-forget:** insert sin `await` antes del `return new Response(...)` → cero latencia agregada al usuario
- **Siempre se inserta:** el objeto `log` se llena progresivamente y se inserta tanto en éxito como en error (catch block)

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

## Eventos de PostHog implementados
- `photo_uploaded`, `icon_generated`, `configurator_add_to_cart`, `configurator_order_now`
- Archivos: `PhotoPetForm.tsx` y `PatapeteConfigurator.tsx`

## Eventos Meta Pixel + CAPI (completos)
| Evento PostHog (lowercase) | Evento Meta (PascalCase) | Cuándo |
|---|---|---|
| `$pageview` | `PageView` | Cada cambio de página |
| `viewcontent` | `ViewContent` | Ver un producto |
| `addtocart` | `AddToCart` | Agregar al carrito |
| `initiatecheckout` | `InitiateCheckout` | Entrar al checkout |
| `purchase` | `Purchase` | Pago exitoso |
| `search_performed` | `Search` | Al buscar |
| `photo_uploaded` | `photo_uploaded` (non-standard) | Subir foto mascota |
| `icon_generated` | `icon_generated` (non-standard) | Ícono generado |
| `configurator_add_to_cart` | `configurator_add_to_cart` (non-standard) | Botón carrito configurador |
| `configurator_order_now` | `configurator_order_now` (non-standard) | Botón ordenar configurador |

**Nota:** Los custom events de Patapete van como `trackCustom` en Meta Pixel.

## Notas técnicas
- PostHog en modo `identified_only` — eventos anónimos visibles en "Events", no en "Activity"
- User's Supabase: `vqmqdhsajdldsraxsqba`
- Edge functions via `userSupabase.functions.invoke()` desde `src/integrations/supabase/client.ts`
- Meta Pixel: eventos custom (`photo_uploaded`, `icon_generated`) deben usar `trackCustom` en vez de `track`
- FALAI_API_KEY aún necesaria para BiRefNet (step 1)
- GEMINI_API_KEY para step 4 (ya configurada)
- ANTHROPIC_API_KEY para step 3 (Haiku)