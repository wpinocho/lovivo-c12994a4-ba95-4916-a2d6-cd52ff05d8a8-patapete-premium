# Plan Maestro — Configurador Patapete (Funcional, 3 Estilos)

## Lo que el usuario quiere
Configurador de producto completamente funcional para los 3 estilos:
- **Icono**: catálogo de razas → preview instantánea en canvas → carrito
- **Vector**: sube foto → remove background en browser → canvas filters (look vectorial) → preview → carrito
- **Tatuaje IA**: sube foto → remove background en browser → Replicate API → preview real → carrito

## Arquitectura por estilo

### ICONO — 100% frontend, sin APIs
- Ilustraciones PNG de ~20 razas populares en México (generadas con imagegen, guardadas en public/breeds/)
- `breedData.ts` con catálogo: { id, label, animalType, imageUrl, colorVariants[] }
- Canvas compositing: dibuja el mockup del tapete + ilustración(es) encima
- Instantáneo, sin esperas, directo al carrito

### VECTOR — Browser-only (sin APIs externas)
- Usuario sube foto → FileReader → ImageData
- Background removal: `@imgly/background-removal` (WebAssembly, gratuito, sin key)
- Canvas post-processing: filtros de posterización/threshold para look vectorial flat
- Compositing del resultado sobre mockup tapete
- Tiempo estimado: ~5-15 segundos
- Sin API externa, 100% gratuito

### TATUAJE IA — Replicate API desde browser
- Usuario sube foto → FileReader
- Background removal: mismo `@imgly/background-removal`
- Llamada directa a Replicate API con imagen (key via VITE_REPLICATE_API_KEY env var)
  - Modelo: `black-forest-labs/flux-schnell` o `tencentarc/photomaker`
  - Input: imagen mascota recortada + prompt de estilo tatuaje
- Resultado montado sobre mockup tapete en canvas
- Tiempo estimado: ~20-40 segundos
- **REQUIRES**: el dueño obtiene API key en replicate.com (gratis para empezar)

## Lo que el dueño necesita proveer (SOLO para Tatuaje IA)
1. Cuenta en replicate.com → obtener API key
2. La key se agrega como variable de entorno VITE_REPLICATE_API_KEY

## UX Flow — 3 pasos

```
PASO 1: Elige tu estilo
  Cards visuales grandes con ejemplo visual:
  [🎨 Tatuaje IA ⭐ Más popular] [✏️ Vector] [🐾 Icono]
  Precio base mostrado en cada card

PASO 2: Configura tu tapete
  → Para ICONO:
    ¿Cuántas mascotas? [1] [2] [3]
    Por mascota: 
      Tipo: [Perro] [Gato]
      Raza: grid visual de opciones con imagen miniatura
      Nombre del tapete (opcional)
    Preview en vivo instantánea en canvas
    
  → Para TATUAJE IA / VECTOR:
    ¿Cuántas mascotas? [1] [2] [3]
    Por mascota:
      Zona de upload (drag & drop o click)
      Vista previa de la foto subida
      Nombre de la mascota
    Frase/nombre para el tapete (opcional)
    Botón "Generar mi preview" →
      Estado: "Quitando el fondo..." (5s)
      Estado: "Generando el arte..." (20-30s)
      Preview real aparece

PASO 3: Resumen + Comprar
  Vista previa del tapete generado (grande)
  Resumen: estilo elegido, nº mascotas, nombres
  Precio final según variante
  Botón "Agregar al carrito" → abre cart sidebar
  Trust badges (envío MX, garantía, hecho en México)
```

## Archivos a CREAR

### Configurador principal
- `src/components/patapete/configurator/PatapeteConfigurator.tsx`
  - Orquesta los 3 pasos con estado global del configurador
  - Progress bar (Paso 1/3, 2/3, 3/3)
  - Maneja transiciones entre pasos
  - Layout 2 col desktop (preview izq, form der) / 1 col mobile

### Pasos
- `src/components/patapete/configurator/StepStyle.tsx`
  - Cards visuales para cada estilo (Tatuaje IA con badge "Más popular")
  - Muestra precio base de cada opción

- `src/components/patapete/configurator/StepPets.tsx`
  - Selector de cantidad de mascotas (1, 2, 3)
  - Bifurca en `IconPetForm` o `PhotoPetForm` según estilo elegido
  - Preview en vivo (canvas) que se actualiza en tiempo real para ICONO
  - Para IA/Vector: upload + botón generar + loading states

- `src/components/patapete/configurator/StepSummary.tsx`
  - Muestra preview grande del tapete
  - Precio final (mapeado a variante real del producto)
  - CTA agregar al carrito con atributos custom

### Sub-componentes
- `src/components/patapete/configurator/IconPetForm.tsx`
  - Grid visual de razas con thumbnail
  - Selector de tipo (perro/gato)
  - Input nombre mascota

- `src/components/patapete/configurator/PhotoPetForm.tsx`
  - Drag & drop zone para upload de foto
  - Botón "Generar preview" (para IA/Vector)
  - Loading states animados con mensajes de progreso
  - Muestra preview de la foto subida antes de procesar

- `src/components/patapete/configurator/CanvasPreview.tsx`
  - Renderiza el canvas con mockup tapete + arte de mascota(s)
  - Para ICONO: actualización instantánea
  - Para IA/Vector: muestra resultado de la API cuando está listo

### Datos y utilidades
- `src/data/breedData.ts`
  - Catálogo de 20 razas: { id, label, animalType: 'dog'|'cat', imageUrl, colors? }
  - Razas perro MX: Labrador, Golden Retriever, Chihuahua, Poodle, Dachshund, Bulldog, Pastor Alemán, Beagle, Shih Tzu, Husky, Boxer, Schnauzer, Yorkshire, Border Collie, French Bulldog
  - Razas gato MX: Mestizo, Siamés, Persa, Maine Coon, Bengalí

- `src/utils/canvasCompositing.ts`
  - `compositeRug(mockupUrl, petImages[], style)` → canvas → dataURL
  - Para ICONO: coloca ilustraciones centradas/distribuidas sobre el tapete
  - Para IA/Vector: coloca imagen procesada sobre tapete

- `src/utils/backgroundRemoval.ts`
  - Wrapper sobre `@imgly/background-removal`
  - `removeBackground(imageFile)` → Blob con transparencia
  - Maneja errores y progreso

- `src/utils/vectorFilter.ts`
  - `applyVectorEffect(canvas)` → aplica filtros CSS/canvas para look vectorial
  - Posterización, threshold, reducción de colores

- `src/utils/replicateApi.ts`
  - `generateTattooArt(imageBase64, petName)` → Promise<imageUrl>
  - Llama a Replicate con VITE_REPLICATE_API_KEY
  - Modelo flux-schnell img2img con prompt de tatuaje

## Archivos a MODIFICAR

- `src/pages/ui/ProductPageUI.tsx`
  - Detectar si `logic.product?.handle === 'tapete-personalizado-patapete'`
  - Si sí → renderizar `<PatapeteConfigurator product={logic.product} addToCart={logic.handleAddToCart} />`
  - Si no → render normal actual

## Estado del configurador (TypeScript)

```typescript
type Style = 'tattoo' | 'vector' | 'icon'
type AnimalType = 'dog' | 'cat'

interface Pet {
  // ICONO
  animalType?: AnimalType
  breedId?: string
  // IA/VECTOR
  photoFile?: File | null
  photoPreviewUrl?: string | null
  processedImageUrl?: string | null // after background removal
  generatedArtUrl?: string | null   // after AI/vector processing
  isProcessingBg?: boolean
  isGeneratingArt?: boolean
  // AMBOS
  name: string
}

interface ConfiguratorState {
  step: 1 | 2 | 3
  style: Style | null
  petCount: 1 | 2 | 3
  pets: Pet[]
  phrase: string
  tapeteMockupUrl: string
  finalPreviewDataUrl?: string | null
  isGenerating: boolean
  error?: string | null
}
```

## Mapeo al carrito (variantes reales)

El producto tiene 9 variantes: Estilo × Número de mascotas
- Tatuaje IA + 1 mascota → $949
- Tatuaje IA + 2 mascotas → precio correspondiente
- Vector + N mascotas → precio correspondiente
- Icono + N mascotas → $449–$599

En `StepSummary.tsx`, mapear `state.style + state.petCount` a `variant_id` real del producto.

Al llamar `addToCart(product, variant)` pasar en notas:
```
estilo: tattoo/vector/icon
mascotas: 1/2/3
mascota_1_nombre: "Max"
mascota_1_breed: "labrador" (solo icono)
mascota_1_arte_url: "https://..." (URL temporal de la imagen generada)
frase: "Bienvenido a casa"
```

## Imágenes a generar (imagegen)

### Ilustraciones para ICONO (public/breeds/)
Estilo: ilustración flat/minimalista, fondo transparente, colores cálidos, stroke limpio
- dog-labrador.png
- dog-golden.png
- dog-chihuahua.png
- dog-poodle.png
- dog-dachshund.png
- dog-bulldog.png
- dog-pastor-aleman.png
- dog-beagle.png
- dog-husky.png
- dog-schnauzer.png
- dog-yorkshire.png
- dog-frenchbulldog.png
- cat-mestizo.png
- cat-siames.png
- cat-persa.png

### Mockup base del tapete (public/)
- tapete-mockup.png — Vista desde arriba del tapete de fibra de coco sin diseño, área central clara donde va el arte

## Dependencia a instalar
```
@imgly/background-removal
```
→ Usar lov-add-dependency en Craft Mode

## Nota sobre Replicate API Key
El dueño necesita:
1. Crear cuenta en replicate.com (gratis)
2. Copiar su API key de la sección "Account" → "API tokens"
3. Agregarla como variable de entorno: VITE_REPLICATE_API_KEY=r8_...
(Instrucciones a dar al dueño cuando llegue este momento)

## Orden de implementación en Craft Mode

1. Instalar `@imgly/background-removal`
2. Generar mockup base del tapete + ilustraciones de razas (imagegen)
3. Crear `breedData.ts` con catálogo completo
4. Crear `canvasCompositing.ts` y `backgroundRemoval.ts`
5. Crear `PatapeteConfigurator.tsx` con estado y estructura de 3 pasos
6. Crear `StepStyle.tsx` — selector de estilos con cards visuales
7. Crear `StepPets.tsx` con bifurcación Icono vs IA/Vector
8. Crear `IconPetForm.tsx` con grid de razas
9. Crear `PhotoPetForm.tsx` con upload y loading states
10. Crear `CanvasPreview.tsx`
11. Crear `StepSummary.tsx` con mapeo a variantes y add to cart
12. Modificar `ProductPageUI.tsx` para detectar slug y renderizar configurador
13. Crear `replicateApi.ts` y `vectorFilter.ts`

## Estado actual
- El configurador NO existe aún (0 archivos creados)
- ProductPageUI.tsx es genérico, sin detección de slug
- Homepage completa y funcional
- Producto real creado con 9 variantes