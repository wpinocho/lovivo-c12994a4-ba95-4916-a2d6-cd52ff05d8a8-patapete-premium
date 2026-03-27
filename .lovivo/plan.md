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

## 🚀 Plan v27 — Mejora conversión upload foto (PENDIENTE)

### Contexto / problema
- Funnel: 285 visitantes reales de Meta → solo ~14 suben foto (~5%)
- La velocidad de página NO es el problema (LCP móvil promedio ~1s, excelente)
- El problema es UX: en mobile el upload form está 2+ scrolls abajo del fold
- No hay tracking de si el usuario llega a ver el upload form o se va antes

### Cambios a implementar

#### 1. Sticky CTA inteligente — `StepPets.tsx`
El sticky bottom bar actualmente siempre dice "Ordenar →".
Cambiar a comportamiento contextual:

**Sin foto subida:**
- Texto: `📸 Sube la foto de tu mascota`
- Color: más prominente / diferente al CTA de compra (ej. outline o secondary)
- Al clicar: llama a `petUploadRef` (ref al input file del primer pet) para abrir el file picker directamente
  - Esto requiere exponer una función `triggerFileInput()` desde `PhotoPetForm` hacia arriba via ref o callback
  - Alternativa más simple: hacer scroll al upload zone Y añadir clase `animate-pulse` temporal al border del upload box

**Con foto subida pero procesando:**
- Mantener disabled / loading state actual

**Con foto lista:**
- Volver al "Ordenar →" / "$949 Ordenar" normal

#### 2. Upload zone más grande en mobile — `PhotoPetForm.tsx`
Actualmente: cuadrito 88x88px con ícono de cámara y "Subir foto"

En mobile hacer la zona de upload FULL WIDTH cuando no hay foto:
```
┌──────────────────────────────────────┐
│   📷  Sube la foto de tu mascota     │
│   Toca aquí · JPG, PNG, WEBP         │
│   Mejor si se ve bien la carita 🐾   │
└──────────────────────────────────────┘
```
- Altura mínima: `min-h-[120px]` en mobile (sm: vuelve al layout horizontal compacto si hay espacio)
- Borde dashed más ancho, color primary/50
- Fondo: `bg-primary/5`
- Toda la zona es clickable (ya lo es, mantener)
- Animación subtle de entrada (fade-in o scale-in)

Cuando hay foto: vuelve al layout compacto horizontal actual (thumbnail 88x88 + nombre)

#### 3. Nuevo evento tracking `upload_zone_viewed` — `PhotoPetForm.tsx`
Usar `useInView` (react-intersection-observer, ya instalado) en el upload zone para detectar cuando el usuario lo ve:

```tsx
const { ref: uploadRef, inView } = useInView({ threshold: 0.5, triggerOnce: true })
useEffect(() => {
  if (inView && petIndex === 0) { // solo pet 0 para no duplicar
    trackCustomEvent('upload_zone_viewed', { pet_index: petIndex })
  }
}, [inView])
```

Esto nos dará el dato clave: ¿cuántos usuarios VEN el upload form vs cuántos lo usan?

#### 4. Evento `page_scroll_depth` — `StepPets.tsx` o `PatapeteConfigurator.tsx`
Trackear al 50% y 90% del scroll de la página para entender bounce vs engagement:

```tsx
useEffect(() => {
  const handleScroll = () => {
    const scrollPct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
    if (scrollPct > 50 && !firedRef.current['50']) {
      firedRef.current['50'] = true
      trackCustomEvent('page_scroll_depth', { depth: 50 })
    }
    if (scrollPct > 90 && !firedRef.current['90']) {
      firedRef.current['90'] = true
      trackCustomEvent('page_scroll_depth', { depth: 90 })
    }
  }
  window.addEventListener('scroll', handleScroll, { passive: true })
  return () => window.removeEventListener('scroll', handleScroll)
}, [])
```

### Archivos a modificar
- `src/components/patapete/configurator/PhotoPetForm.tsx`:
  - Upload zone full-width en mobile cuando no hay foto
  - Exponer ref/callback para triggerFileInput desde afuera
  - Añadir `upload_zone_viewed` tracking via useInView
- `src/components/patapete/configurator/StepPets.tsx`:
  - Sticky CTA bar: lógica contextual (sin foto → "Sube tu foto", con foto → "Ordenar")
  - Al clicar sticky sin foto: abrir file picker del pet[0] directamente
  - Añadir scroll depth tracking
  - Ref a `triggerFileInput` de PhotoPetForm[0]

### Prioridad de impacto esperado
1. **Sticky CTA inteligente** → mayor impacto, reduce fricción del CTA principal
2. **Upload zone grande** → mayor visibilidad del paso clave
3. **Tracking upload_zone_viewed** → nos da el dato faltante para diagnosticar mejor
4. **Scroll depth** → contexto adicional para análisis

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