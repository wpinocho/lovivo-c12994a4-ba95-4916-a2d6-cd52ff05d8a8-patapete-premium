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
  - `public/logo.webp` — patita tejida de coco café, fondo transparente, 578x432 original → guardada en repo
  - `public/favicon.png` — misma patita, 64x47px PNG con transparencia
  - `index.html` — favicon → `/favicon.png`, apple-touch-icon → `/logo.webp`, meta title/description de Patapete
  - `BrandLogoLeft.tsx` — ya usa `src="/logo.webp"` con width/height 36

- **Sticky preview layout:**
  - `StepPets.tsx`: Reestructurado con sticky preview.
    - **Desktop:** Grid `lg:grid-cols-2 lg:items-start`. Left column tiene `sticky top-20` con CanvasPreview. Right column tiene el form completo y scrollea normalmente.
    - **Mobile:** CanvasPreview aparece PRIMERO (arriba del form) con `sticky top-16 z-10`.

- **Rediseño de página de producto (Patapete):**
  - `StepPets.tsx`: Header rediseñado como página de producto real — h1 con título, star rating (4.9), precio dinámico arriba a la derecha, descripción.
  - `ProductPageUI.tsx`: Reestructurado — configurador PRIMERO, testimonios + FAQ DEBAJO del fold.

- **Componentes nuevos creados:**
  - `ProductSocialProof.tsx` — stats bar + 3 review cards
  - `ProductFAQ.tsx` — 6 preguntas frecuentes con Accordion
  - `StepSummary.tsx` — resumen con garantía Patapete prominente, specs del producto, timeline post-compra

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