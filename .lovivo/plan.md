# Patapete Store — Plan

## Current State
Tienda ecommerce de tapetes personalizados con mascota (Patapete). El configurador principal está en `src/components/patapete/configurator/`.

## Recent Changes
- **PageTemplate.tsx**: Fixed `"pt-20 py-6"` → `"pt-20 pb-6"` (tailwind-merge conflicto: py-6 descartaba pt-20, dejando solo 24px top en vez de 80px → stars detrás del navbar)
- **StepPets.tsx stars row**: Added `flex-wrap shrink-0 whitespace-nowrap` para robustez
- **Hero image optimizada**: Comprimida de varios MB a ~166KB, servida localmente como `/hero-patapete.webp`
- **Google Fonts**: Cambiado a patrón non-blocking preload+onload (mejora FCP)
- **PatapeteHero.tsx**: Actualizada a usar hero local optimizado
- **Order summary**: Muestra "Sublimación HD" con sparkle icon

## Known Issues Fixed
- **Stars/rating row invisible**: tailwind-merge en PageTemplate descartaba `pt-20` cuando coexistía con `py-6`, resultando en solo 24px de padding-top. El navbar (~62px) tapaba el contenido que iniciaba a los 40px. Fix: `pt-20 pb-6`.

## Key Files
- `src/templates/PageTemplate.tsx` - Layout wrapper con pt-20 pb-6
- `src/components/patapete/configurator/StepPets.tsx` - Configurador principal
- `src/components/patapete/PatapeteHero.tsx` - Hero de landing
- `public/hero-patapete.webp` - Hero image optimizada localmente

## Architecture Notes
- 95% del tráfico real es Desktop (PostHog data)
- Configurador usa CanvasPreview sticky en desktop (top-20) y sticky en mobile (top-16)
- Sticky CTA bar aparece cuando el botón de CTA está fuera de vista