# Patapete — Plan de mejora de conversión

## Estado actual
- Tienda activa con campaña de Meta en curso
- Pipeline de IA: BiRefNet (Fal) → Normalización → Claude Haiku → **Gemini 2.5 Flash Image (stable)**
- Bug "Ordenar ahora → carrito vacío" ✅ CORREGIDO
- Auto-retry generación IA al montar ✅ IMPLEMENTADO

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

## ✅ Auto-retry generación IA al recargar — RESUELTO

### Archivo modificado
`src/components/patapete/configurator/PatapeteConfigurator.tsx`

### Comportamiento
- Si el ícono **ya terminó** cuando recargas → se muestra de localStorage sin re-generar ✅
- Si recargas **a mitad** de la generación → `autoRetryDoneRef` useEffect detecta foto sin ícono y arranca automáticamente
- Mismo comportamiento al cambiar de app en móvil, bloquear pantalla, o Safari matar la conexión

### Implementación
```tsx
const autoRetryDoneRef = useRef(false)

useEffect(() => {
  if (autoRetryDoneRef.current) return
  autoRetryDoneRef.current = true

  state.pets.forEach((pet, i) => {
    if (
      i < state.petCount &&
      pet.photoBase64 &&
      !pet.generatedArtUrl &&
      !pet.isProcessingBg &&
      !pet.isGeneratingArt
    ) {
      handleGenerate(i)
    }
  })
}, []) // corre solo una vez al montar
```

### Por qué funciona
- `handleGenerate` con `fileOverride=undefined` + `pet.photoBase64` disponible → salta compresión, va directo al backend con la foto guardada
- `useRef` flag evita que corra en re-renders
- El user solo ve la barra de progreso normal, sin botón "Reintentar"