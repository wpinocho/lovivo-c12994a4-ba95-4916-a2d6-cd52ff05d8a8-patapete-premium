# Plan Maestro — Configurador Patapete

## Estado Actual — FASE 1 COMPLETADA ✅

El configurador de producto está construido y activo. Se activa automáticamente cuando el usuario visita el producto con slug `tapete-personalizado-patapete`.

## Lo que fue construido

### Imágenes generadas (public/)
- `/tapete-mockup.jpg` — mockup base del tapete (vista superior)
- `/breeds/dog-labrador.png` hasta `cat-persa.png` — 15 ilustraciones flat de razas
  - Perros: labrador, golden, chihuahua, poodle, dachshund, bulldog, pastor-aleman, beagle, husky, schnauzer, yorkshire, frenchbulldog
  - Gatos: mestizo, siames, persa

### Dependencia instalada
- `@imgly/background-removal@latest` — background removal en browser (WebAssembly, gratis)

### Archivos creados
- `src/data/breedData.ts` — catálogo de 15 razas con URLs de Supabase Storage
- `src/utils/canvasCompositing.ts` — compositing de tapete + ilustraciones en canvas
- `src/utils/backgroundRemoval.ts` — wrapper de @imgly/background-removal
- `src/utils/vectorFilter.ts` — efecto vectorial por posterización de canvas
- `src/utils/replicateApi.ts` — llamada a Replicate API (necesita Phase 2 para activar)
- `src/components/patapete/configurator/types.ts` — tipos TypeScript
- `src/components/patapete/configurator/StepStyle.tsx` — paso 1: selector de estilos
- `src/components/patapete/configurator/StepPets.tsx` — paso 2: configurar mascotas
- `src/components/patapete/configurator/StepSummary.tsx` — paso 3: resumen + carrito
- `src/components/patapete/configurator/IconPetForm.tsx` — form de raza para estilo Ícono
- `src/components/patapete/configurator/PhotoPetForm.tsx` — upload foto para IA/Vector
- `src/components/patapete/configurator/CanvasPreview.tsx` — preview en canvas
- `src/components/patapete/configurator/PatapeteConfigurator.tsx` — orquestador principal

### Archivos modificados
- `src/pages/ui/ProductPageUI.tsx` — detecta slug `tapete-personalizado-patapete` y renderiza PatapeteConfigurator

## Variantes reales del producto
Producto ID: `07e2ec97-5364-495e-a835-0041748553af`
Slug: `tapete-personalizado-patapete`

| Estilo | 1 mascota | 2 mascotas | 3 mascotas |
|--------|-----------|-----------|-----------|
| Tatuaje IA | 28fc993c ($649) | 1aee4582 ($799) | 5f7e007d ($949) |
| Vector | 27cec5b7 ($549) | 6527bbc6 ($699) | 0adfce44 ($849) |
| Ícono | 802557e3 ($449) | 052f9fae ($599) | 00a90496 ($749) |

## Estado por estilo

### ✅ ÍCONO — Completamente funcional
- Selección de raza con grid visual de ilustraciones
- Preview en vivo en canvas (actualización instantánea)
- Compositing: ilustración circular sobre mockup del tapete
- Nombre de mascota y frase opcionales
- Add to cart con variante correcta
- Customization guardada en localStorage (clave `patapete_order_*`)

### ✅ VECTOR — Interfaz completa, pipeline parcial
- Upload de foto con drag & drop
- Background removal automático en navegador (@imgly/background-removal)
- Efecto vectorial (posterización + reducción de colores)
- Preview en canvas del resultado
- Add to cart con variante correcta

### ⏳ TATUAJE IA — Interfaz completa, API pendiente
- Upload de foto + background removal funcional
- La llamada a Replicate API falla sin API key (ver FASE 2)
- Para activar: configurar la API key via Supabase Edge Function

## Fase 2 — Activar Tatuaje IA

### Problema
Los env vars `VITE_*` no son soportados en el entorno Lovivo. La API key de Replicate no puede ir en frontend.

### Solución: Supabase Edge Function
1. Crear `supabase/functions/generate-tattoo/index.ts`
   - Recibe: `{ imageBase64: string, petName: string }`
   - Usa secret `REPLICATE_API_KEY` (via supabase_create_secrets)
   - Llama a Replicate API desde el servidor
   - Retorna: `{ artUrl: string }`
2. Actualizar `src/utils/replicateApi.ts` para llamar a esta edge function
3. Almacenar la API key con supabase_create_secrets

### Pasos para el dueño
1. Crear cuenta en replicate.com (gratis)
2. Copiar API key de Account → API tokens
3. Dárnosla para configurarla via supabase_create_secrets

## Customization en pedidos
Cuando el cliente agrega al carrito, se guarda en localStorage:
```json
{
  "style": "Ícono",
  "petCount": 2,
  "pets": [{ "name": "Max", "breed": "Labrador" }, { "name": "Luna", "breed": "Golden Retriever" }],
  "phrase": "Bienvenidos a casa",
  "previewDataUrl": "data:image/jpeg;base64,...",
  "timestamp": "2026-03-10T..."
}
```
Clave: `patapete_order_${timestamp}`

## Notas técnicas
- Canvas compositing: ilustraciones en círculos con fondo crema sobre mockup tapete
- Breed images: URLs de Supabase Storage (pattern: `https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/product-images/c12994a4-ba95-4916-a2d6-cd52ff05d8a8/{filename}`)
- CORS: crossOrigin='anonymous' en carga de imágenes para canvas
- Progress bar: 3 pasos con indicador visual
- Layout: 2 columnas desktop (preview | form), 1 columna mobile