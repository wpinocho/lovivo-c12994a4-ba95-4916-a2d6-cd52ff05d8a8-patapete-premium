# Patapete — Plan del Proyecto

## Estado General
Tienda de tapetes personalizados con mascotas. El configurador interactivo (`PatapeteConfigurator`) genera retratos de mascotas con IA (FLUX) y los compone sobre un mockup de tapete.

## Arquitectura de Almacenamiento
- Assets estáticos en `public/` del repo (mismo origen, sin CORS, sin expiración)
- Imágenes demo: `public/demos/icono-0.webp`, `icono-1.webp`, `icono-2.webp`
- Tapete mockup: `public/tapete-mockup.webp`

## Estado del Estilo
- **Estilo activo: `icono`** — siempre forzado en estado inicial y tras cargar localStorage
- Estilo `dibujo` oculto hasta tener sus imágenes demo

## Bug corregido: Imagen de referencia ICONO incorrecta (v2 — usuario proveyó imagen)
- La URL anterior apuntaba a una imagen generada que no era el estilo correcto
- **Fix v2**: El usuario subió la referencia correcta — Border Terrier peekaboo illustration con colores sólidos, líneas bold y fondo claro
- URL nueva: `https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773698793129-msnlow463lm.webp`
- Edge function actualizada con nueva URL

## Bug corregido: Cache al borrar imagen (X button)
- **Antes**: X button llamaba `onChange({...null})` → saveToStorage en useEffect (asíncrono)
- **Ahora**: X button llama `onClear()` → `handleClearPet(index)` en PatapeteConfigurator
  - Resetea el pet a `DEFAULT_PET` en estado
  - Llama `saveToStorage(newState)` de forma **síncrona** dentro del setState callback
  - Limpia también los `fieldErrors` en StepPets

## Cambios Recientes
- Bug fix: estilo `icono` ahora se fuerza correctamente incluso al cargar desde localStorage
- **PhotoPetForm rediseñado** — layout horizontal compacto: thumbnail 88×88px a la izquierda
- **Loading UX Pro implementado** ✅:
  - Mensajes rotativos emocionales en `replicateApi.ts` (4s, 9s, 14s, 18s)
  - `progressMessage` añadido al tipo `Pet` y al `DEFAULT_PET`
  - Barra de progreso ease-out (rápido al inicio, lento al final)
  - Glow pulsante alrededor del thumbnail durante generación

## Loading UX — Detalles de Implementación

### Curva ease-out de la barra
Milestones: 8% → 28% (2s) → 48% (5s) → 64% (9s) → 76% (13s) → 86% (17s) → 93% (21s) → 100% (al recibir resultado)

### Mensajes rotativos
- 0s: "Analizando tu mascota..."
- 4s: "Detectando rasgos únicos..."
- 9s: "Capturando la personalidad..."
- 14s: "Pintando el retrato..."
- 18s: "¡Casi listo! ✨"

## Prompts IA (Edge Function generate-tattoo)

### ICONO (v3 — referencia provista por usuario)
- Referencia: Border Terrier peekaboo illustration — colores sólidos, líneas bold, fondo claro
- URL: `https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773698793129-msnlow463lm.webp`
- Prompt base Haiku: extrae tipo animal, pelaje, colores, expresión, rasgos clave
- Template final: "charming flat 2D cartoon illustration, bold clean outlines, solid color fills, sticker/app icon style, NO sketchy lines"
- FLUX prompt wrapper: "MUST match style: bold clean outlines, solid color fills, flat/cel-shaded, bright vibrant colors, white background. NO sketchy lines, NO fine detail texture, NO painterly look."

### DIBUJO (v1 — b&w linocut)  
- Referencia: `style-dibujo.png` (b&w line art — correcto)
- Prompt base Haiku: extrae solo info estructural (ignora colores), rasgos físicos, accesorios
- Template final: "pure black and white, only extremely thick chunky bold black lines, linocut/rubber stamp style"

## Archivos modificados (últimos cambios)
- `supabase/functions/generate-tattoo/index.ts` — STYLE_REFERENCE_ICONO_URL actualizada con imagen del usuario
- `src/components/patapete/configurator/PatapeteConfigurator.tsx` — `handleClearPet` + pasa `onClearPet`
- `src/components/patapete/configurator/StepPets.tsx` — `onClearPet` prop + `handleClearPet` local
- `src/components/patapete/configurator/PhotoPetForm.tsx` — `onClear` prop, X button usa `onClear()`