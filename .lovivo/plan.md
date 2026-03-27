# Patapete — Plan de mejora de conversión

## Estado actual
- Tienda activa con campaña de Meta en curso
- Pipeline de IA: BiRefNet (Fal) → Normalización → Claude Haiku → **Gemini 2.5 Flash Image (stable)**
- Bug "Ordenar ahora → carrito vacío" ✅ CORREGIDO
- Auto-retry generación IA al montar ✅ IMPLEMENTADO
- **Async Job Queue (anti-loop móvil) ✅ IMPLEMENTADO (v25)**
- **Bug thumbnail rota + remove background ✅ CORREGIDO (v26)**
- **Mejoras de conversión UX ✅ IMPLEMENTADAS (v27)**

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

## ✅ Mejoras de conversión UX (v27 — IMPLEMENTADAS)

### Problema
- 285 visitantes reales de Meta → solo ~4-5% suben foto
- Upload form estaba 2+ scrolls abajo del fold en mobile
- No había tracking para saber si el problema era "no ven el upload" vs "lo ven pero no actúan"

### Cambios implementados

#### 1. Upload zone full-width en mobile — `PhotoPetForm.tsx` ✅
- Cuando no hay foto: zona full-width con `min-h-[120px]`, icono de cámara grande, texto claro "Sube la foto de tu mascota" + "Toca aquí · JPG, PNG, WEBP" + "Mejor si se ve bien la carita 🐾"
- Borde dashed `border-primary/40`, fondo `bg-primary/5`, hover más oscuro
- Animación `animate-in fade-in-0 zoom-in-95`
- Cuando hay foto: vuelve al layout horizontal compacto (thumbnail 88x88 + nombre)

#### 2. `onRegisterTrigger` prop — `PhotoPetForm.tsx` ✅
- Prop `onRegisterTrigger?: (fn: () => void) => void`
- `useEffect` en mount: llama `onRegisterTrigger?.(() => fileInputRef.current?.click())`
- Permite al padre abrir el file picker programáticamente

#### 3. Sticky CTA inteligente — `StepPets.tsx` ✅
- `hasAnyPhoto = pets.slice(0, petCount).some(p => !!p.photoPreviewUrl || !!p.photoBase64 || !!p.generatedArtUrl)`
- **Sin foto:** sticky SIEMPRE visible (ignora ctaInView), muestra "Falta la foto de tu mascota" + botón "📸 Sube tu foto" con `animate-pulse-subtle`
  - Al clicar: `triggerPet0FileInput.current?.()` → abre file picker directamente
  - Trackea evento `sticky_cta_upload_tap`
- **Con foto:** comportamiento anterior (aparece cuando CTA de compra sale del viewport, muestra precio + "Ordenar →")

#### 4. Tracking `upload_zone_viewed` — `PhotoPetForm.tsx` ✅
- `useInView({ threshold: 0.5, triggerOnce: true })` en el upload zone full-width
- Dispara `trackCustomEvent('upload_zone_viewed', { pet_index })` solo para pet 0
- Nos da el dato clave: ¿cuántos ven el upload vs cuántos suben?

#### 5. Scroll depth tracking — `StepPets.tsx` ✅
- `useEffect` con `window.addEventListener('scroll', ...)` passive
- Eventos `page_scroll_depth` al 50% y 90%
- `scrollDepthFiredRef` evita duplicados

#### 6. Animación `animate-pulse-subtle` — `tailwind.config.ts` ✅
- Keyframe: 0%,100% scale(1) opacity(1), 50% scale(0.97) opacity(0.88)
- 2s ease-in-out infinite

### Archivos modificados
- `src/components/patapete/configurator/PhotoPetForm.tsx`
- `src/components/patapete/configurator/StepPets.tsx`
- `tailwind.config.ts`

### Próximos pasos (análisis)
Una vez activo ~1 semana con tráfico, revisar en PostHog:
- Ratio `upload_zone_viewed` / `$pageview` → % que llegan a ver el upload
- Ratio `photo_uploaded` / `upload_zone_viewed` → % que suben habiendo visto el upload
- `sticky_cta_upload_tap` → cuántos tapan directamente desde el sticky
- `page_scroll_depth` 50% / 90% → engagement del contenido

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