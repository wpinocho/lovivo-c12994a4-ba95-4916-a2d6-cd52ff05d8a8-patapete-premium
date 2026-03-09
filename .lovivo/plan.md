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

## ✅ ACTIVE PLAN: Configurador de Producto Patapete

### Estrategia técnica por estilo

#### Estilo ICONO (catálogo, 100% automatizado)
- NO usa la foto real del usuario
- Biblioteca de ilustraciones SVG/PNG prediseñadas por raza (~25 razas top México)
- El usuario selecciona: tipo de animal → raza → color → nombre
- Preview se compone en el browser con Canvas o CSS sobre mockup del tapete
- Instantáneo, cero APIs externas, va directo al carrito con los datos como custom attributes

#### Estilo TATUAJE IA + VECTOR (semi-manual para MVP)
- El usuario sube su foto real
- Selecciona cuántas mascotas (1-3), agrega nombre por mascota, frase opcional
- Paga normalmente en checkout
- Mensaje claro en UI: "Tu preview personalizado llegará en 2-4 horas vía WhatsApp"
- El equipo de Patapete procesa manualmente (o con MidJourney/remove.bg) y envía preview
- El cliente aprueba → producción comienza
- Los datos del pedido (fotos, nombres, frase) se guardan como custom order attributes en el checkout

### UX Flow del Configurador (3 pasos)

```
PASO 1: Elige tu estilo
  ┌─────────────────────────────────────────────┐
  │  [Tatuaje IA ⭐]  [Vector]  [Icono]         │
  │  Cards con preview visual de cada estilo    │
  └─────────────────────────────────────────────┘

PASO 2: Configura tu tapete (varía según estilo)
  
  → ICONO:
  │  ¿Cuántas mascotas? [1] [2] [3]
  │  Mascota #1: [Tipo: Perro/Gato/Otro] [Raza dropdown] [Color] [Nombre]
  │  Mascota #2: (si aplica)
  │  Mascota #3: (si aplica)  
  │  Frase opcional (texto libre, max 40 chars)
  │  → Preview en vivo se actualiza al instante
  
  → TATUAJE IA / VECTOR:
  │  ¿Cuántas mascotas? [1] [2] [3]
  │  Mascota #1: [Sube foto] + [Nombre]
  │  Mascota #2: (si aplica)
  │  Mascota #3: (si aplica)
  │  Frase opcional
  │  → Placeholder preview del tapete (no generado aún)
  │  → Nota: "Tu arte personalizado llega en 2-4 hrs vía WhatsApp"

PASO 3: Resumen + Precio + Comprar
  │  Preview del tapete (vivo para Icono, placeholder para IA/Vector)
  │  Precio calculado según variante (estilo × nº mascotas)
  │  Botón: "Agregar al carrito → Comprar"
  │  Trust badges: preview garantizado, producción México, envío incluido
```

### Implementación técnica

#### 1. Crear componente `PatapeteConfigurator.tsx`
Archivo: `src/components/patapete/PatapeteConfigurator.tsx`

Multi-step wizard con 3 pasos. Estado local con useState:
```typescript
{
  step: 1 | 2 | 3,
  style: 'tattoo' | 'vector' | 'icon' | null,
  petCount: 1 | 2 | 3,
  pets: Array<{
    // Para Icono:
    animalType: 'dog' | 'cat' | 'other',
    breed: string,
    colorVariant: string, // key de la ilustración
    name: string,
    // Para IA/Vector:
    photoFile: File | null,
    photoPreviewUrl: string | null,
    name: string,
  }>,
  phrase: string,
}
```

#### 2. Sub-componentes del configurador

**`ConfiguratorStepStyle.tsx`** — Paso 1
- Cards de los 3 estilos con preview visual
- Indicador "Más vendido" en Tatuaje IA
- Al seleccionar, animación de selección y avance al paso 2

**`ConfiguratorStepPets.tsx`** — Paso 2 (varía por estilo)
- Para Icono:
  - Selector de cantidad (1/2/3) como el de la imagen de referencia
  - Por cada mascota: dropdown tipo + dropdown raza + selector color + input nombre
  - Razas disponibles: Labrador, Golden, French Bulldog, Chihuahua, Pastor Alemán, Beagle, Poodle, Bulldog, Dachshund, Boxer, Gato Persa, Gato Siamés, Gato Naranja, Gato Negro, Gato Blanco + "Otro"
  - Live preview se actualiza en canvas o CSS con ilustraciones SVG
  
- Para Tatuaje IA / Vector:
  - Selector de cantidad (1/2/3)
  - Por cada mascota: upload zone (drag & drop o click) + preview de la foto + input nombre
  - Frase opcional
  - Banner informativo: "⏱️ Tu arte personalizado llegará en 2-4 hrs vía WhatsApp"

**`ConfiguratorPreview.tsx`** — Preview del tapete
- Para Icono: Canvas/CSS que compone mockup del tapete + ilustraciones + texto
  - Usar imagen base del tapete de fibra de coco como fondo (`/material-coco.jpg` o un mockup limpio)
  - Posicionar las ilustraciones de animales centradas con CSS absolute positioning
  - Texto del nombre y frase superpuestos con font similar a los tapetes
- Para IA/Vector: Mockup del tapete con un placeholder artístico (la foto del usuario en overlay semitransparente sobre el tapete, con el estilo seleccionado como badge)

**`ConfiguratorStepSummary.tsx`** — Paso 3
- Resumen visual: preview + precio + detalles
- Precio dinámico basado en: style + petCount → busca la variante correcta del producto
- Botón "Agregar al carrito" que:
  1. Llama a `logic.handleOptionSelect` para seleccionar la variante correcta
  2. Pasa custom attributes al carrito con todos los datos de configuración
  3. Llama a `logic.handleAddToCart`

#### 3. Ilustraciones para Icono
Generar con herramienta de imágenes ~25 ilustraciones de animales en estilo cartoon/cute consistente con la marca Patapete (no infantil, cálido, premium). Formato PNG con fondo transparente, ~400x400px.

Razas prioritarias para perros:
- Labrador amarillo, Labrador café, Labrador negro
- Golden Retriever
- French Bulldog atigrado, French Bulldog blanco, French Bulldog negro
- Chihuahua café, Chihuahua negro/blanco
- Pastor Alemán
- Beagle
- Poodle blanco, Poodle negro, Poodle café
- Bulldog inglés
- Dachshund
- Boxer

Razas/tipos para gatos:
- Gato naranja (tabby)
- Gato negro
- Gato blanco
- Gato gris
- Gato siamés

Para cada uno: variante sentado/de frente estilo "asomándose" como en la imagen de referencia.

#### 4. Mockup base del tapete
Necesitamos un mockup del tapete de fibra de coco visto desde arriba, limpio, sin diseño, que sirva de base para el preview compositor.
- Dimensiones: 800x600px aprox (proporción tapete real)
- Con la textura de fibra de coco visible
- Espacio central donde se compondrán los elementos

#### 5. Modificar `ProductPageUI.tsx`
Detectar si el producto es el tapete Patapete (por slug `tapete-personalizado-patapete`) y en ese caso renderizar el `<PatapeteConfigurator>` pasando el `logic` del HeadlessProduct como prop, en lugar de mostrar el layout genérico.

```tsx
// En ProductPageUI.tsx, antes del return principal:
if (logic.product?.slug === 'tapete-personalizado-patapete') {
  return <PatapeteConfigurator logic={logic} />
}
```

#### 6. Custom attributes en el carrito
Al añadir al carrito, incluir los datos del pedido como custom attributes:
- `configuracion_estilo`: tattoo | vector | icon
- `num_mascotas`: 1 | 2 | 3
- `mascota_1_nombre`: string
- `mascota_1_foto_url`: string (uploaded URL) o `mascota_1_raza`: string (para Icono)
- `mascota_2_*`, `mascota_3_*` (si aplica)
- `frase`: string

El sistema de carrito de la plataforma acepta custom attributes via la función `handleAddToCart`.

### Archivos a crear/modificar
- **CREAR** `src/components/patapete/PatapeteConfigurator.tsx` — Componente principal del configurador
- **CREAR** `src/components/patapete/configurator/ConfiguratorStepStyle.tsx`
- **CREAR** `src/components/patapete/configurator/ConfiguratorStepPets.tsx`
- **CREAR** `src/components/patapete/configurator/ConfiguratorStepSummary.tsx`
- **CREAR** `src/components/patapete/configurator/ConfiguratorPreview.tsx`
- **CREAR** `src/components/patapete/configurator/breedData.ts` — Datos de razas + mapeo a ilustraciones
- **MODIFICAR** `src/pages/ui/ProductPageUI.tsx` — Detectar tapete Patapete y renderizar configurador
- **GENERAR** ilustraciones PNG para el catálogo de Icono (via imagegen)
- **GENERAR** mockup base del tapete para preview compositor

### Decisiones de diseño del configurador
- Diseño full-page sin sidebar, pasos centrados, anchura máxima 900px
- Colores del design system de Patapete (terracota, crema, etc.)
- Paso actual marcado visualmente con barra de progreso (1/3 → 2/3 → 3/3)
- Preview pegajosa (sticky) en desktop al lado derecho del formulario en paso 2
- En mobile: preview arriba, formulario abajo
- Animación de transición entre pasos (fade + slide)
- Botón "Atrás" siempre visible para volver al paso anterior
- Validación: no se puede avanzar sin completar campos requeridos (foto o raza, nombre)

### Fases de implementación
**Fase 1 (MVP):** Configurador completo para los 3 estilos + preview básica para Icono + flujo semi-manual para IA/Vector. Checkout funcional con custom attributes.
**Fase 2:** Automatizar Tatuaje IA + Vector con APIs (remove.bg + Replicate). Preview real generada en tiempo real.
**Fase 3:** Guardar borradores, favoritos, compartir configuración.

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