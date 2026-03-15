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
- **Rediseño de página de producto (Patapete):**
  - `StepPets.tsx`: Header rediseñado como página de producto real — h1 con título, star rating (4.9), precio dinámico arriba a la derecha, descripción. Eliminados: badge "Sparkles", h2 "Diseña tu tapete", label "Preview en vivo", label mobile "Preview"
  - `ProductPageUI.tsx`: Reestructurado orden — configurador PRIMERO (above the fold), testimonios + FAQ DEBAJO del fold. Layout: max-w-5xl, separación de 20 unidades entre secciones

- **Componentes nuevos creados:**
  - `ProductSocialProof.tsx` — stats bar + 3 review cards (ahora colocado debajo del configurador)
  - `ProductFAQ.tsx` — 6 preguntas frecuentes con Accordion
  - `StepSummary.tsx` — resumen con garantía Patapete prominente, specs del producto (60×40, fibra de coco, 5-7 días), timeline "¿Qué pasa después de ordenar?"

## Known Issues
- Reviews de Carlos M. y Sara P. no tienen foto de tapete (solo Ana T. tiene imagen real del tapete)

## Pending
- Usuario proporcionará fotos reales de más tapetes para integrar en testimonios
- Imagen hero `/hero-patapete.jpg` existe en public/

## Architecture Notes
- Slug especial: `tapete-personalizado-patapete` → renderiza PatapeteConfigurator
- Variant IDs hardcoded en StepSummary.tsx para 1/2/3 mascotas
- Precios: $649 (1 mascota), $799 (2), $949 (3) — mismo precio para ambos estilos
- Customization data guardada en localStorage con key `patapete_order_${Date.now()}`