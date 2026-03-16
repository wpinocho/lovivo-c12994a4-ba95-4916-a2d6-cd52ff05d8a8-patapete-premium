# Patapete Configurator — Plan

## Current State
- Configurador visual integrado en la página de producto
- Solo estilo **icono** activo (dibujo ocultado por ahora)
- Estilo fijo en 'icono' — selector de estilo removido del UI
- El configurador empieza directamente en "¿Cuántas mascotas?"
- Assets estáticos (demos + tapete) en `public/` del repo — mismo origen, cero CORS

## Architecture: Two Supabase layers

### 1. Lovivo Platform (shared, NO modificar)
- `src/lib/supabase.ts` + `src/lib/edge.ts`
- Maneja products, orders, checkout, payments

### 2. User's Own Supabase (modificable)
- `src/integrations/supabase/client.ts` → `userSupabase`
- Bucket `pet-tattoos` (PUBLIC) — guarda los retratos generados por IA que sube el usuario
- Edge functions: `generate-tattoo`, `upload-patapete-preview`

## Static Assets (public/ folder — same origin, no CORS, never expire)
- `/tapete-mockup.webp` — fondo del tapete
- `/demos/icono-0.webp` — terrier (mascota demo 1)
- `/demos/icono-1.webp` — chihuahua (mascota demo 2)
- `/demos/icono-2.webp` — bulldog francés (mascota demo 3)
- ⏳ `/demos/dibujo-0.webp`, `dibujo-1.webp`, `dibujo-2.webp` — pendientes (estilo dibujo oculto por ahora)

## Variant IDs (product)
- 1 mascota: `28fc993c-e638-459b-9a00-08abacdc9f32`
- 2 mascotas: `1aee4582-040b-477a-b335-e99446fa76c7`
- 3 mascotas: `5f7e007d-b30e-44c8-baa6-5aa03edb23ad`

## Flow
1. ~~StepStyle~~ (removido — solo icono por ahora)
2. **StepPets** — seleccionar cantidad de mascotas, subir fotos, frases, CTA

## Pending
- Verificar que `/demos/icono-*.webp` estén correctamente en el repo (pueden faltar si no se guardaron en sesión anterior)
- Backend: ALTER TABLE `order_items` para columnas `customization_data` JSONB y `preview_image_url` TEXT
- Cuando se reactive el estilo dibujo: agregar imágenes demo y reactivar selector