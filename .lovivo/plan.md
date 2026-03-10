# Patapete — Plan de Implementación

## Estado Actual
Configurador de tapetes personalizados con dos estilos: **Tatuaje IA** y **Vector**.
El flujo arranca directo en la vista de personalización con selector de estilo integrado.

## Stack Técnico
- Frontend: React/TS + Tailwind
- Backend: Supabase (conectado y funcional)
- IA: Replicate API (`REPLICATE_API_KEY` en secrets de Supabase)
- Proceso de imagen: remove background en canvas (navegador, sin API) + vector effect en canvas + Replicate para tatuaje

## Archivos Clave del Configurador
- `src/components/patapete/configurator/PatapeteConfigurator.tsx` — estado global, orquesta el flujo
- `src/components/patapete/configurator/StepPets.tsx` — formulario + preview (desktop y mobile)
- `src/components/patapete/configurator/CanvasPreview.tsx` — canvas compositing con demo images
- `src/components/patapete/configurator/PhotoPetForm.tsx` — upload foto + botón generar
- `src/components/patapete/configurator/StepSummary.tsx` — resumen antes de añadir al carrito
- `src/utils/canvasCompositing.ts` — lógica de composición sobre el tapete mockup
- `src/utils/replicateApi.ts` — llamada a edge function generate-tattoo
- `src/utils/backgroundRemoval.ts` — remove background en navegador
- `src/utils/vectorFilter.ts` — vector effect en canvas
- `supabase/functions/generate-tattoo/index.ts` — proxy seguro hacia Replicate

## Imágenes Demo
Generadas en `public/demo/`:
- `pet-demo-1.webp` — Golden retriever con corona botánica (estilo tatuaje línea fina)
- `pet-demo-2.webp` — Gato atigrado con estrellas (estilo tatuaje línea fina)
- `pet-demo-3.webp` — Bulldog francés con flores (estilo tatuaje línea fina)

## Bugs Corregidos (sesión actual)
**Bug: Loading spinner nunca se quitaba**
- **Causa raíz**: loop infinito. `pets.slice(0, petCount)` en StepPets creaba nueva referencia de array en cada render. El `useEffect` en CanvasPreview tenía `pets` como dep (referencia), así que se disparaba en cada re-render del padre. `onPreviewReady(dataUrl)` hacía `setState` en PatapeteConfigurator → re-render → nuevo array → efecto se dispara de nuevo. Con el mecanismo de `renderKeyRef`, el render anterior era siempre "stale" → `setIsLoading(false)` nunca se llamaba.
- **Fix 1 (CanvasPreview)**: Reemplazar `pets` en las deps del useEffect por `petKey` (string estable derivada del CONTENIDO de pets). El efecto sólo re-corre cuando el contenido real cambia.
- **Fix 2 (PatapeteConfigurator)**: `onPreviewReady` ahora guarda en un `ref` (`finalPreviewRef`) en lugar de `setState`, eliminando el ciclo de re-renders. El URL sólo pasa a state cuando el usuario hace clic en "Ver resumen".
- **Simplificación**: Se eliminó el `renderKeyRef` y se reemplazó por un flag `cancelled` con cleanup de useEffect (más idiomático en React).

## Flujo de Usuario
1. Entra al configurador → ve tapete con mascotas demo (50% opacidad, borde punteado)
2. Elige estilo (Tatuaje IA / Vector) y cantidad de mascotas
3. Sube foto de su mascota
4. Hace clic en "Generar con IA" (tatuaje) o "Vectorizar" (vector)
5. Ve el resultado en el preview en tiempo real
6. Agrega frase opcional
7. "Ver resumen" → selecciona tamaño → añade al carrito

## Pendiente / Mejoras Futuras
- Verificar que la edge function `generate-tattoo` conecta correctamente con Replicate en producción
- Agregar tapete mockup real en `public/tapete-mockup.jpg` (actualmente usa gradient fallback)
- Test de flujo completo end-to-end con foto real de mascota