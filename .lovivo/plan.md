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

---

## 🔧 PENDIENTE: Arquitectura Async (Job Queue) — Anti-loop en móvil

### El problema real
El auto-retry resuelve UNA reconexión, pero no el loop infinito:
1. User sube foto → generación empieza (conexión HTTP abierta)
2. Cambia de app en iOS → Safari mata la conexión HTTP (~30s en background)
3. Vuelve → auto-retry arranca generación de nuevo (nueva conexión HTTP)
4. Sale de nuevo → conexión muere otra vez
5. Repite → user dice "esto no funciona" y abandona

### La solución: Job Queue + Polling
En lugar de esperar la respuesta HTTP durante 30 segundos, el cliente:
1. Manda la foto → recibe un `job_id` en <1 segundo
2. El servidor procesa en background (sin mantener la conexión del cliente)
3. El cliente hace polling cada 3-5 segundos preguntando "¿ya terminó el job X?"
4. Si el user cierra la app 10 veces, cuando regresa → el resultado ya está guardado en DB → lo ve al instante

### Implementación detallada

#### 1. Nueva tabla `generation_jobs` (migración SQL)
```sql
CREATE TABLE generation_jobs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status        text NOT NULL DEFAULT 'processing', -- 'processing' | 'done' | 'error'
  result_url    text,
  error_message text,
  style         text,
  pet_name      text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- RLS: anónimos pueden leer sus propios jobs (por job_id, no hay auth aquí)
-- Service role puede insertar/actualizar
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_by_id" ON generation_jobs
  FOR SELECT USING (true);
CREATE POLICY "service_role_all" ON generation_jobs
  FOR ALL USING (auth.role() = 'service_role');
```
Nombre sugerido de migración: `20260325000000_create_generation_jobs.sql`

#### 2. Modificar `supabase/functions/generate-tattoo/index.ts`
- Aceptar `jobId` (uuid) opcional en el request body
- Al inicio: si `jobId` proporcionado → upsert row en `generation_jobs` con `status='processing'`
- Al final exitoso: UPDATE `generation_jobs` SET `status='done', result_url=permanentArtUrl, updated_at=now()`
- En error: UPDATE `generation_jobs` SET `status='error', error_message=..., updated_at=now()`
- Si NO se pasa `jobId` → comportamiento actual (backward compatible)
- El response sigue siendo `{ url: permanentArtUrl }` — igual que antes para compatibilidad

**CRÍTICO:** El UPDATE de `generation_jobs` se hace con `await` (NO fire-and-forget) porque es esencial que el cliente pueda leer el resultado. El UPDATE de `generation_logs` sigue siendo fire-and-forget.

#### 3. Nueva edge function `supabase/functions/poll-generation/index.ts`
```typescript
// GET ?job_id=xxx
// Returns: { status: 'processing' | 'done' | 'error', result_url?: string, error_message?: string }
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  
  const url = new URL(req.url)
  const jobId = url.searchParams.get('job_id')
  if (!jobId) return new Response(JSON.stringify({ error: 'job_id required' }), { status: 400, headers: corsHeaders })
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { data, error } = await supabase
    .from('generation_jobs')
    .select('status, result_url, error_message')
    .eq('id', jobId)
    .single()
  
  if (error || !data) return new Response(JSON.stringify({ status: 'not_found' }), { headers: corsHeaders })
  
  return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
```

#### 4. Modificar `src/utils/replicateApi.ts`
- Exportar nueva función `generateTattooArtAsync(imageBase64, petName, style, jobId, onProgress)` que:
  1. Llama a `generate-tattoo` con el `jobId`
  2. La llamada SÍ puede morir sin problema (el servidor sigue procesando)
  3. Inicia polling cada 3 segundos a `poll-generation?job_id={jobId}`
  4. Cuando `status='done'` → retorna `result_url`
  5. Cuando `status='error'` → lanza error
  6. Timeout después de 3 minutos (60 polls × 3s) → lanza error
- Mantener la función original `generateTattooArt` para compatibilidad temporal

```typescript
// Lógica de polling
async function pollForResult(jobId: string, onProgress?: TattooProgressCallback): Promise<string> {
  const maxAttempts = 60 // 3 minutos
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 3000))
    const { data } = await userSupabase.functions.invoke('poll-generation', {
      // Use GET with query params via custom fetch
    })
    if (data?.status === 'done') return data.result_url
    if (data?.status === 'error') throw new Error(data.error_message || 'Error generando imagen')
  }
  throw new Error('Tiempo de espera agotado. Intenta de nuevo.')
}
```

**NOTA:** `userSupabase.functions.invoke` no soporta GET params directamente. Usar `fetch` con la URL directa del edge function:
```typescript
const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/poll-generation?job_id=${jobId}`, {
  headers: { 'Authorization': `Bearer ${ANON_KEY}`, 'apikey': ANON_KEY }
})
```

Leer SUPABASE_URL y ANON_KEY desde `src/integrations/supabase/client.ts`.

#### 5. Modificar `PatapeteConfigurator.tsx` — Job ID persistence
- Agregar al tipo de `Pet` (en `types.ts`): `jobId?: string`
- Antes de llamar `handleGenerate`, generar un UUID v4 con `crypto.randomUUID()`
- Pasar el `jobId` a `handleGenerate(petIndex, file, jobId)`
- Guardar `jobId` en el estado del pet y en localStorage (ya persiste automáticamente via `saveToStorage`)
- Modificar `loadFromStorage` para restaurar `jobId` desde localStorage

**Lógica de auto-resume en `useEffect` al montar:**
```typescript
// En lugar de llamar handleGenerate directamente (que haría una nueva llamada HTTP),
// primero verificar si hay un job en curso:
state.pets.forEach(async (pet, i) => {
  if (i < state.petCount && pet.photoBase64 && !pet.generatedArtUrl && pet.jobId) {
    // Verificar si el job ya terminó en el servidor
    const result = await pollJobOnce(pet.jobId)
    if (result.status === 'done') {
      handlePetChange(i, { generatedArtUrl: result.result_url })
    } else if (result.status === 'processing') {
      // El servidor aún está procesando — solo iniciar polling, NO llamar generate-tattoo de nuevo
      startPollingForJob(i, pet.jobId)
    } else {
      // Error o not_found → retry completo con nuevo jobId
      handleGenerate(i)
    }
  } else if (i < state.petCount && pet.photoBase64 && !pet.generatedArtUrl && !pet.jobId) {
    // Sin jobId (primera vez) → llamar generate normalmente
    handleGenerate(i)
  }
})
```

#### 6. Modificar `PersistedState` en `PatapeteConfigurator.tsx`
```typescript
interface PersistedPet {
  name: string
  photoBase64: string | null
  generatedArtUrl: string | null
  jobId: string | null  // NEW
}
```

Y en `loadFromStorage` y `saveToStorage` incluir `jobId`.

#### 7. Modificar `src/components/patapete/configurator/types.ts`
Agregar `jobId?: string` al tipo `Pet`.

### Archivos a crear/modificar
| Archivo | Acción |
|---------|--------|
| `supabase/migrations/20260325000000_create_generation_jobs.sql` | CREAR |
| `supabase/functions/generate-tattoo/index.ts` | MODIFICAR (aceptar jobId, actualizar DB) |
| `supabase/functions/poll-generation/index.ts` | CREAR |
| `src/utils/replicateApi.ts` | MODIFICAR (añadir polling async) |
| `src/components/patapete/configurator/types.ts` | MODIFICAR (añadir jobId a Pet) |
| `src/components/patapete/configurator/PatapeteConfigurator.tsx` | MODIFICAR (job ID persistence + smart resume) |

### Comportamiento final esperado
1. User sube foto → UUID generado → `generate-tattoo` llamado → respuesta <1s con job_id → polling inicia
2. User cambia de app durante 30s → iOS mata la conexión HTTP → **el servidor SIGUE procesando** (30s es suficiente para el pipeline)
3. User vuelve → auto-resume detecta jobId sin resultado → llama poll-generation → ya está done → muestra resultado ✅
4. User vuelve antes de que el server termine → polling reanuda desde donde estaba → sin doble llamada al pipeline
5. User regresa después de 2 minutos → resultado esperando, se muestra al instante ✅

### UX (sin cambios visibles)
- Misma barra de progreso animada
- Mismos mensajes "Analizando tu mascota..." etc
- El user no nota la diferencia — simplemente funciona siempre