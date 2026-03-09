# Store Plan — Patapete
(Auto-actualizado por Lovivo AI)

## Current State
Homepage completa de Patapete está construida y funcional.

## Brand
- **Nombre:** Patapete
- **Producto:** Tapetes de fibra de coco personalizados con arte de mascotas
- **Mercado:** México
- **Estilos:** Tatuaje IA, Vector, Icono
- **Mascotas:** 1 a 3 por tapete

## Design System
- **Fuentes:** Playfair Display (display/headlines), Plus Jakarta Sans (body/sans)
- **Paleta:** Crema cálido (#F8F5F0), carbón suave, terracota primary (hsl 16 58% 42%), arena secundario, verde oliva accent
- **Radius:** 0.75rem
- **Sombras personalizadas:** `shadow-warm`, `shadow-warm-lg`, `shadow-primary`, `shadow-primary-lg`
- **Animaciones:** `fade-up`, `fade-in`, `scale-in`, `slide-in-right`, `float`
- **Clases custom:** `hero-overlay`, `texture-section`, `section-padding`, `card-premium`, `trust-badge`, `headline-display`

## Producto creado
- **ID:** `07e2ec97-5364-495e-a835-0041748553af`
- **Slug:** `tapete-personalizado-patapete`
- **Variantes:** 9 (Estilo × Mascotas: $449–$949 MXN)
- **URL producto:** `/productos/tapete-personalizado-patapete`

## Imágenes generadas (public/)
- `/hero-patapete.jpg` — Hero principal (flux.pro)
- `/style-tattoo.jpg` — Estilo Tatuaje IA
- `/style-vector.jpg` — Estilo Vector
- `/style-icon.jpg` — Estilo Icono
- `/before-after-patapete.jpg` — Transformación foto→arte→tapete
- `/gallery-patapete.jpg` — Galería de tapetes
- `/material-coco.jpg` — Textura fibra de coco
- `/cta-patapete.jpg` — CTA final (flux.pro)

## Archivos clave del proyecto
```
src/
├── components/patapete/
│   ├── PatapeteHero.tsx
│   ├── PatapeteTrustStrip.tsx
│   ├── PatapeteHowItWorks.tsx
│   ├── PatapeteStyles.tsx
│   ├── PatapeteTransformation.tsx
│   ├── PatapeteGallery.tsx
│   ├── PatapeteBenefits.tsx
│   ├── PatapetePersonalization.tsx
│   ├── PatapeteMaterials.tsx
│   ├── PatapeteFAQ.tsx
│   ├── PatapeteFinalCTA.tsx
│   └── PatapeteWhatsApp.tsx
├── components/BrandLogoLeft.tsx
├── templates/EcommerceTemplate.tsx
└── pages/ui/IndexUI.tsx — Homepage principal
    pages/ui/ProductPageUI.tsx — Página de producto (a reemplazar con configurador)
```

## WhatsApp
- URL placeholder: `https://wa.me/5215500000000?text=...`
- **PENDIENTE:** El dueño debe actualizar el número de WhatsApp real en `PatapeteWhatsApp.tsx`

## User Preferences
- Estilo: DTC premium, cálido, limpio, emocional
- Tono: Cercano, claro, mexicano natural, orientado a conversión
- Sin: colores chillones, infantil, genérico
- CTA principal siempre: "Diseña tu tapete" / "Diseña el tuyo"

---

## ✅ ACTIVE PLAN: Configurador de Producto Patapete (REAL, Funcional)

### Arquitectura técnica por estilo

#### Estilo ICONO — 100% frontend, sin backend
- Biblioteca de ilustraciones PNG pre-hechas por raza
- Preview compositing en canvas (HTML5 Canvas API) en el browser
- Instantáneo, sin APIs externas, directo al carrito

#### Estilo TATUAJE IA — Pipeline real automatizado
1. Usuario sube foto → se lee como File en browser
2. **Background removal**: librería `@imgly/background-removal` (WebAssembly, gratuita, sin API key)
   - Corre en el browser, produce PNG con transparencia
3. **Generación de estilo**: llamada a Replicate API
   - Modelo recomendado: `black-forest-labs/flux-schnell` img2img con prompt de estilo tatuaje
   - O alternativamente: `tencentarc/photomaker` con style transfer
   - La llamada se hace desde **Supabase Edge Function** para ocultar la API key
4. **Compositing**: el resultado se monta sobre el mockup del tapete en canvas
5. Preview en vivo → el usuario aprueba → agrega al carrito

#### Estilo VECTOR — Pipeline real automatizado
1. Usuario sube foto → background removal igual que arriba
2. **Vectorización**: opción A: Vectorizer.ai API (desde edge function), opción B: canvas filters (posterize + threshold) que dan look vectorial decente sin API
3. **Compositing**: resultado montado en canvas sobre mockup tapete
4. Preview en vivo → carrito

### Ingredientes necesarios
- **`@imgly/background-removal`** — npm package, gratuito, background removal en browser (WebAssembly)
- **Replicate API key** — para Tatuaje IA ($0.003–$0.05 por imagen según modelo)
- **Supabase Edge Function** — para hacer la llamada a Replicate sin exponer la key
- **Mockup base del tapete** — imagen PNG 800x600 de fibra de coco vista desde arriba, sin diseño, para compositing

### UX Flow del Configurador (mismo diseño, ahora con pipeline real)

```
PASO 1: Elige tu estilo
  Cards visuales: [Tatuaje IA ⭐ Más vendido] [Vector] [Icono]

PASO 2: Configura
  → ICONO:
    ¿Cuántas mascotas? [1] [2] [3]
    Por mascota: tipo → raza → variante color → nombre
    Preview en vivo instantánea (canvas compositing)
  
  → TATUAJE IA / VECTOR:
    ¿Cuántas mascotas? [1] [2] [3]
    Por mascota: upload zone + nombre
    Frase opcional
    Botón "Generar preview" →
      1. Spinner: "Quitando el fondo..."
      2. Spinner: "Generando tu arte..."
      3. Preview real del tapete aparece
    (Tiempo: ~20-40 segundos)

PASO 3: Resumen + Precio + Comprar
  Preview del tapete generado
  Precio según variante (estilo × nº mascotas)
  Botón "Agregar al carrito"
  Trust badges
```

### Implementación técnica — Fases

#### FASE 1 (Craft Mode actual): Icono completo + UI del configurador
1. **Crear `PatapeteConfigurator.tsx`** — wrapper principal que detecta el producto y reemplaza la página genérica
2. **Crear `ConfiguratorStepStyle.tsx`** — paso 1, selector de estilos
3. **Crear `ConfiguratorStepPets.tsx`** — paso 2, configura mascotas (bifurca en Icono vs IA/Vector)
4. **Crear `ConfiguratorPreview.tsx`** — canvas compositing del tapete
5. **Crear `ConfiguratorStepSummary.tsx`** — paso 3, checkout
6. **Crear `breedData.ts`** — catálogo de razas y mapeo a ilustraciones
7. **Modificar `ProductPageUI.tsx`** — detectar slug y renderizar configurador
8. **Generar ilustraciones** para Icono (~25 razas)
9. **Generar mockup base** del tapete para canvas compositing
10. **Para Tatuaje IA/Vector en FASE 1**: mostrar estado "Procesando..." con preview placeholder real (la foto del user con overlay del estilo), y mensaje "Tu arte personalizado llegará vía WhatsApp en 2-4 hrs" — funcional para vender mientras se construye el pipeline completo

#### FASE 2 (próxima sesión): Pipeline AI real
1. **Instalar `@imgly/background-removal`** via lov-add-dependency
2. **Crear Supabase Edge Function** `generate-pet-art`:
   ```typescript
   // supabase/functions/generate-pet-art/index.ts
   // Recibe: { imageBase64, style: 'tattoo' | 'vector', prompt }
   // Llama a Replicate API
   // Devuelve: { resultImageUrl }
   ```
3. **Integrar pipeline** en `ConfiguratorStepPets.tsx`:
   - Upload foto → background removal en browser → enviar a edge function → mostrar resultado
4. **Variables de entorno** necesarias en Supabase:
   - `REPLICATE_API_KEY` — obtener en replicate.com
   - `VECTORIZER_API_KEY` — obtener en vectorizer.ai (opcional para Vector)

### Estado del configurador (TypeScript)
```typescript
type ConfiguratorState = {
  step: 1 | 2 | 3
  style: 'tattoo' | 'vector' | 'icon' | null
  petCount: 1 | 2 | 3
  pets: Array<{
    // Icono:
    animalType?: 'dog' | 'cat' | 'other'
    breed?: string
    colorVariant?: string
    // IA/Vector:
    photoFile?: File | null
    photoPreviewUrl?: string | null
    processedImageUrl?: string | null // resultado después del pipeline AI
    isProcessing?: boolean
    // Ambos:
    name: string
  }>
  phrase: string
  generatedPreviewUrl?: string | null // compositing final
  isGenerating: boolean
}
```

### Custom attributes al carrito
Al hacer addToCart, pasar en las notas/metadata:
- `configuracion_estilo`: 'tattoo' | 'vector' | 'icon'
- `num_mascotas`: 1 | 2 | 3
- `mascota_1_nombre`, `mascota_2_nombre`, `mascota_3_nombre`
- `mascota_1_foto` (URL de la foto procesada en Supabase Storage)
- `mascota_1_raza` (para Icono)
- `frase`: string

### Archivos a crear/modificar
- **CREAR** `src/components/patapete/PatapeteConfigurator.tsx`
- **CREAR** `src/components/patapete/configurator/ConfiguratorStepStyle.tsx`
- **CREAR** `src/components/patapete/configurator/ConfiguratorStepPets.tsx`
- **CREAR** `src/components/patapete/configurator/ConfiguratorStepSummary.tsx`
- **CREAR** `src/components/patapete/configurator/ConfiguratorPreview.tsx`
- **CREAR** `src/components/patapete/configurator/breedData.ts`
- **MODIFICAR** `src/pages/ui/ProductPageUI.tsx` — detectar slug tapete y renderizar configurador
- **GENERAR** ilustraciones PNG para Icono (via imagegen)
- **GENERAR** mockup base tapete para canvas compositing

### Decisiones de diseño
- Layout: 2 columnas en desktop (preview izq, formulario der — como la imagen de referencia)
- En mobile: preview arriba, formulario abajo
- Progress bar visual (Paso 1/3, 2/3, 3/3)
- Animaciones entre pasos: fade + slide
- Loading state para pipeline AI: spinner con mensajes de progreso ("Quitando el fondo de tu foto...", "Generando el arte...", "¡Listo!")
- Colores del design system Patapete

---

## Futuras Sesiones (backlog)
### Colecciones
- Crear colección "Para perros"
- Crear colección "Para gatos"
- Crear colección "Idea de regalo"

### Blog
- Actualizar `blogPosts.ts` con artículos Patapete

### SEO
- Agregar JSON-LD structured data para el producto
- Meta description personalizada
- OG tags para Meta Ads

### Mejoras de diseño
- Testimonios reales (una vez que haya clientes)
- Contador de tapetes diseñados (social proof dinámico)