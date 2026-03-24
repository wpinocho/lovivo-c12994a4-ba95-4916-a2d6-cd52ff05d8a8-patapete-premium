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

---

## 🐛 BUG: "Ordenar ahora" llega al checkout con carrito vacío

### Diagnóstico del problema
**Root cause:** `handleOrderNow` en `PatapeteConfigurator.tsx` solo llama `addItem()` (actualiza CartContext local) y luego `navigate('/pagar')` inmediatamente. El checkout page (`/pagar`) requiere un **backend order activo** (orderId + checkoutToken en sessionStorage) para mostrar los items — sin eso, `useOrderItems` retorna vacío y se ve "Tu carrito está vacío".

El flujo correcto (que sí funciona con "Agregar al carrito" → ir al carrito → proceder al pago) es:
1. `addItem()` → CartContext
2. `checkout()` desde `useCheckout` → llama `createCheckoutFromCart` → crea orden en backend
3. Guarda `checkout_order` y `checkout_order_id` en sessionStorage
4. `navigate('/pagar')` → checkout page encuentra el orderId → carga items

### Decisión de tracking (opción B del usuario)
Disparar **ambos eventos**: `AddToCart` + `InitiateCheckout` para funnel completo en PostHog y Meta.

### Fix a implementar en `src/components/patapete/configurator/PatapeteConfigurator.tsx`

**Nuevos imports:**
```ts
import { useCheckout } from '@/hooks/useCheckout'
import { useSettings } from '@/contexts/SettingsContext'
import { trackAddToCart, trackInitiateCheckout } from '@/lib/tracking-utils'
```

**Nuevo hook en el componente:**
```ts
const { checkout, isLoading: isCreatingOrder } = useCheckout()
const { currencyCode } = useSettings()
```

**`handleOrderNow` reescrito:**
```ts
const handleOrderNow = useCallback(async () => {
  if (!product) return
  const currentState = state
  const variantId = VARIANT_IDS[currentState.petCount]
  const variant = product?.variants?.find((v: any) => v.id === variantId)

  saveCustomizationToCart(currentState, variantId, product.id)
  addItem(product, variant)

  // Tracking: AddToCart (estándar Meta funnel)
  trackAddToCart({
    products: [{ id: product.id, name: product.title, price: variant?.price ?? product.price, variant_id: variantId }],
    value: variant?.price ?? product.price,
    currency: currencyCode,
    num_items: 1,
  })

  // Tracking: custom event Patapete
  trackCustomEvent('configurator_order_now', {
    pet_count: currentState.petCount,
    style: currentState.style,
    has_phrase: !!currentState.phrase,
    variant_id: variantId,
  })

  try {
    // Crear la orden en el backend (como hace CartAdapter.handleCreateCheckout)
    try {
      sessionStorage.setItem('checkout_cart', JSON.stringify({ items: [{ product, variant, quantity: 1 }], total: variant?.price ?? product.price }))
    } catch {}

    const order = await checkout({ currencyCode })

    try {
      sessionStorage.setItem('checkout_order', JSON.stringify(order))
      sessionStorage.setItem('checkout_order_id', String(order.order_id))
    } catch {}

    // Tracking: InitiateCheckout (estándar Meta funnel)
    trackInitiateCheckout({
      products: [{ id: product.id, name: product.title, price: variant?.price ?? product.price, variant_id: variantId }],
      value: order.total_amount ?? (variant?.price ?? product.price),
      currency: currencyCode,
      num_items: 1,
    })

    navigate('/pagar')
  } catch (error) {
    console.error('Error creating checkout from configurator:', error)
    // Fallback: igual navegar al checkout, el usuario verá el error
    navigate('/pagar')
  }
}, [product, state, addItem, navigate, saveCustomizationToCart, checkout, currencyCode])
```

**También:** Exponer `isCreatingOrder` para desactivar el botón mientras se crea la orden:
- El botón "Ordenar ahora" debe estar disabled cuando `isCreatingOrder` es true
- Texto durante loading: "Procesando..." o similar
- Pasar `isCreatingOrder` como prop hasta `StepPets` → CTA buttons

### Archivos a modificar
- `src/components/patapete/configurator/PatapeteConfigurator.tsx`: Reescribir `handleOrderNow` con checkout completo
- `src/components/patapete/configurator/StepPets.tsx`: Recibir y manejar `isCreatingOrder` prop para deshabilitar botones mientras se procesa

### Notas importantes
- `checkout()` internamente llama `createCheckoutFromCart(cart.items, ...)` — y `cart.items` ya tendrá el item que acabamos de agregar con `addItem()` porque ambos comparten el mismo CartContext
- El `checkout()` también llama `clearCart()` después de crear la orden — esto es correcto
- `handleAddToCart` NO necesita cambios (ese flujo ya funciona correctamente)