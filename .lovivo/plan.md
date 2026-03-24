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

## Próximos pasos pendientes
- Probar con diferentes razas/colores para verificar calidad Gemini 2.5
- Monitorear logs step 4: tiempo de respuesta

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

---

## 📋 FEATURE PENDIENTE: Tabla de logs de generación

### Qué queremos lograr
Guardar en Supabase cada generación de imagen con todos los datos relevantes para debugging y análisis, **sin agregar ninguna latencia al flujo principal**.

### Estrategia: Fire and Forget
Lanzar el insert a Supabase SIN await justo antes del `return new Response(...)`. El usuario recibe su imagen inmediatamente. La promesa del insert se resuelve en background.

```typescript
// Insert sin await = zero latency para el usuario
supabase.from('generation_logs').insert({...})
  .then(() => console.log('[generate-tattoo] Log saved'))
  .catch(e => console.error('[generate-tattoo] Log failed:', e.message))

return new Response(JSON.stringify({ url: permanentArtUrl }), { ... })
```

### Tabla a crear: `generation_logs`

```sql
CREATE TABLE generation_logs (
  id                   uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at           timestamptz DEFAULT now(),
  pet_name             text,
  style                text,
  haiku_input_prompt   text,
  haiku_output_prompt  text,
  gemini_prompt        text,
  gemini_output_url    text,
  latency_birefnet_ms  integer,
  latency_haiku_ms     integer,
  latency_gemini_ms    integer,
  latency_total_ms     integer
);
```

### Cambios en `supabase/functions/generate-tattoo/index.ts`

#### 1. Modificar `generateWithGemini` para devolver también el prompt de texto

Cambiar la firma de retorno:
```typescript
async function generateWithGemini(...): Promise<{ base64: string; mimeType: string; promptUsed: string }>
```
Al final de la función, devolver también `promptUsed: finalPrompt`.

#### 2. En el main handler, capturar latencias y prompts

```typescript
const tStart = Date.now()  // para tiempo total

// Step 1 - capturar latencia
const t1 = Date.now()
const transparentPngUrl = await removeBackgroundFal(...)
const latencyBirefnet = Date.now() - t1

// Steps 2, 2.5 (sin cambios)

// Step 3 - capturar latencia y el prompt de input (system prompt)
const haikuInputPrompt = artStyle === 'icono' ? SYSTEM_PROMPT_ICONO : SYSTEM_PROMPT_DIBUJO
const t3 = Date.now()
const optimizedPrompt = await generatePromptWithVision(normalizedBase64, artStyle)
const latencyHaiku = Date.now() - t3

// Step 4 - capturar latencia y prompt de Gemini
const t4 = Date.now()
const { base64: artBase64, mimeType: artMimeType, promptUsed: geminiPrompt } = await generateWithGemini(petUrl, optimizedPrompt, artStyle)
const latencyGemini = Date.now() - t4

// Step 6
const permanentArtUrl = await uploadFinalArt(artBase64, artMimeType)
const latencyTotal = Date.now() - tStart

// 🔥 FIRE AND FORGET — NO await, zero latency para el usuario
const supabaseLog = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
supabaseLog.from('generation_logs').insert({
  pet_name: petName || null,
  style: artStyle,
  haiku_input_prompt: haikuInputPrompt,
  haiku_output_prompt: optimizedPrompt,
  gemini_prompt: geminiPrompt,
  gemini_output_url: permanentArtUrl,
  latency_birefnet_ms: latencyBirefnet,
  latency_haiku_ms: latencyHaiku,
  latency_gemini_ms: latencyGemini,
  latency_total_ms: latencyTotal,
}).then(() => console.log('[generate-tattoo] ✓ Log saved to generation_logs'))
  .catch(e => console.error('[generate-tattoo] Log save failed:', e.message))

// Retornar al usuario INMEDIATAMENTE
return new Response(JSON.stringify({ url: permanentArtUrl }), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
})
```

### Archivos a modificar
1. **Nuevo migration**: `supabase/migrations/TIMESTAMP_create_generation_logs.sql` — crear tabla
2. **`supabase/functions/generate-tattoo/index.ts`** — capturar datos + fire-and-forget insert