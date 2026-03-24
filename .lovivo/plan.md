# Patapete — Plan de mejora de conversión

## Estado actual
- Tienda activa con campaña de Meta en curso
- Pipeline de IA: BiRefNet (Fal) → Normalización → Claude Haiku → **Gemini 2.5 Flash Image (stable)**
- Bug "Ordenar ahora → carrito vacío" ✅ CORREGIDO

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

## Tabla generation_logs ✅ COMPLETA
- Migración original: `supabase/migrations/20260324012833_create_generation_logs.sql`
- Migración columnas imagen: `supabase/migrations/20260324152816_add_image_urls_to_generation_logs.sql`
- Migración status/error: `supabase/migrations/20260324194609_add_status_and_error_to_generation_logs.sql`
- Columnas completas: `id`, `created_at`, `pet_name`, `style`, `status`, `error_message`, `user_image_url`, `pet_normalized_url`, `haiku_input_prompt`, `haiku_output_prompt`, `gemini_prompt`, `gemini_output_url`, `latency_birefnet_ms`, `latency_haiku_ms`, `latency_gemini_ms`, `latency_total_ms`
- **Estrategia fire-and-forget:** insert sin `await` antes del `return new Response(...)` → cero latencia agregada al usuario

## Historial de modelos probados
- `gemini-2.5-flash-preview-04-17` → 404 (modelo de texto, no genera imágenes)
- `gemini-2.0-flash-preview-image-generation` → funcionaba pero deprecado
- `gemini-2.5-flash-preview-image` → 404 (nombre incorrecto, orden erróneo)
- `gemini-2.5-flash-image` → **CORRECTO** (stable, doc oficial: ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-image)

## Notas críticas del modelo
- Nombre estable: `gemini-2.5-flash-image`
- Alias: "Nano Banana"
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

## Notas técnicas
- PostHog en modo `identified_only` — eventos anónimos visibles en "Events", no en "Activity"
- User's Supabase: `vqmqdhsajdldsraxsqba`
- Edge functions via `userSupabase.functions.invoke()` desde `src/integrations/supabase/client.ts`
- Meta Pixel: eventos custom (`photo_uploaded`, `icon_generated`) deben usar `trackCustom` en vez de `track`
- FALAI_API_KEY aún necesaria para BiRefNet (step 1)
- GEMINI_API_KEY para step 4 (ya configurada)
- ANTHROPIC_API_KEY para step 3 (Haiku)

---

## ✅ Bug "Ordenar ahora" → checkout vacío — RESUELTO

### Root cause
`useOrderItems.loadOrderItems` es un hook stale-while-revalidate que SOLO lee del cache localStorage. Si no hay `order_items`, simplemente muestra "Tu carrito está vacío".

### Fix implementado (v2) — `PatapeteConfigurator.tsx`
1. Después de `createCheckoutFromCart`, verificar si `order.order.order_items` tiene items
2. Si está vacío/undefined → llamar `updateCheckout({ include_product_details: true })` para forzar carga
3. Guardar el resultado en `checkoutState` vía `saveCheckoutState`
4. Mirror de CartAdapter: también guardar `checkout_order` y `checkout_order_id` en sessionStorage
5. **Error handling mejorado:** Si falla → mostrar error al usuario (NO navegar silenciosamente)

---

## 🔧 PRÓXIMO FIX: Auto-retry generación IA al recargar (sin botón)

### Contexto / comportamiento esperado
- Si el ícono YA terminó de generarse antes del reload → ya funciona, `generatedArtUrl` está en localStorage y se restaura automáticamente ✅
- Si el user recarga/cierra la app MIENTRAS se estaba generando → la conexión HTTP con el edge function se corta. El resultado se pierde. Al recargar: hay `photoBase64` en localStorage pero `generatedArtUrl` es null → actualmente muestra el botón "Reintentar con IA"
- **Objetivo:** eliminar ese botón y que la generación arranque SOLA automáticamente al detectar foto sin ícono

### Fix a implementar — `src/components/patapete/configurator/PatapeteConfigurator.tsx`

Agregar un `useEffect` que corre **una sola vez al montar** el componente. Usa un `useRef` flag para garantizar que solo corre una vez (no en re-renders).

```tsx
// After all useCallback definitions, before the return statement:

const autoRetryDoneRef = useRef(false)

useEffect(() => {
  if (autoRetryDoneRef.current) return
  autoRetryDoneRef.current = true

  // Auto-restart generation for pets that have a photo but no art yet
  // (handles reload/close-app mid-generation scenario)
  state.pets.forEach((pet, i) => {
    if (pet.photoBase64 && !pet.generatedArtUrl && !pet.isProcessingBg && !pet.isGeneratingArt) {
      handleGenerate(i)
    }
  })
}, []) // eslint-disable-line react-hooks/exhaustive-deps — intentionally run once on mount
```

### Por qué funciona
- `handleGenerate` capturado en el closure inicial tiene el estado correcto de localStorage
- El branch existente en `handleGenerate` ya maneja este caso: `compressedBase64 = pet.photoBase64!` → salta la compresión, va directo al backend
- El `useRef` flag evita que corra múltiples veces por re-renders
- El user verá la barra de progreso normal, no el botón "Reintentar"

### Nota importante
No es posible recuperar una generación interrumpida mid-flight. La conexión HTTP al edge function se corta al recargar. Lo que sí hacemos es auto-retomar enviando de nuevo la misma foto guardada (sin que el user haga nada).

### Archivo a modificar
- `src/components/patapete/configurator/PatapeteConfigurator.tsx`
  - `useRef` ya está importado ✅
  - Agregar `autoRetryDoneRef` + `useEffect` de auto-retry después de los handlers existentes