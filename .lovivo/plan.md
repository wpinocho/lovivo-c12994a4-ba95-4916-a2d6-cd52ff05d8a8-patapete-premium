# Patapete — Plan & Estado

## Current State
Tienda de tapetes personalizados con mascotas. Configurador de producto funcional con:
- Canvas preview en vivo (CanvasPreview)
- Generación de arte vía IA (Replicate/FLUX)
- Persistencia en localStorage
- StepPets → StepSummary flow
- Testimonios, FAQ, social proof en la página de producto

## User Preferences
- Marca premium, cercana, humana — NO mencionar IA directamente al usuario
- La mascota como protagonista emocional
- Messaging: "Solo para tu mascota · Diseño exclusivo" (no "Retrato IA")
- Español en toda la UI

## Recent Changes
- **Logo y favicon actualizados (versión definitiva):**
  - `public/logo.webp` — patita tejida de coco café, fondo transparente
  - `public/favicon.png` — misma patita, 64x47px PNG con transparencia
  - `index.html` — favicon → `/favicon.png`, apple-touch-icon → `/logo.webp`
  - `BrandLogoLeft.tsx` — usa `src="/logo.webp"` con width/height 36

- **Layout fix — ancho completo:**
  - `PatapeteConfigurator.tsx`: Removido `max-w-4xl mx-auto` → ahora usa `w-full` para aprovechar todo el ancho del template

- **4 mejoras de conversión en StepPets.tsx:**
  1. **Barra sticky CTA** — aparece cuando `canContinue && !ctaInView`. Solo activa cuando hay fotos subidas. Muestra precio y botón "Ver resumen →".
  2. **Trust badges** — 3 íconos bajo el botón: Pago seguro / Envío incluido / Garantía total.
  3. **Fecha estimada de entrega** — calculada dinámicamente (+7-10 días hábiles), mostrada en el header.
  4. **Contador de demanda social** — "X personas lo están viendo ahora" (estable por hora, 8-24).

- **Dependencia añadida:** `react-intersection-observer` (ya se usaba en ProductPageUI pero no estaba en package.json)

- **Sticky preview layout:**
  - Desktop: Grid `lg:grid-cols-2 lg:gap-10 lg:items-start`. Left column sticky top-20 con CanvasPreview.
  - Mobile: CanvasPreview sticky top-16 z-10.

## Known Issues
- Reviews de Carlos M. y Sara P. no tienen foto de tapete (solo Ana T. tiene imagen real del tapete)

## Pending
- Usuario proporcionará fotos reales de más tapetes para integrar en testimonios

## Architecture Notes
- Slug especial: `tapete-personalizado-patapete` → renderiza PatapeteConfigurator
- Variant IDs hardcoded en StepSummary.tsx para 1/2/3 mascotas
- Precios: $649 (1 mascota), $799 (2), $949 (3) — mismo precio para ambos estilos
- Customization data guardada en localStorage con key `patapete_order_${Date.now()}`
- Navbar height estimada: ~64px mobile / ~80px desktop (top-16 / top-20 para sticky)
- `BrandLogoLeft.tsx` usa `src="/logo.webp"` con width/height 36