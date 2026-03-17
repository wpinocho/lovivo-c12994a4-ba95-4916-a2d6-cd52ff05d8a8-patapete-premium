# Patapete Store — Plan

## Current State
Tienda ecommerce de tapetes personalizados con mascota (Patapete). El configurador principal está en `src/components/patapete/configurator/`.

## Recent Changes
- **PageTemplate.tsx**: Fixed `"pt-20 py-6"` → `"pt-20 pb-6"` (tailwind-merge conflicto)
- **Hero image optimizada**: ~166KB, servida localmente como `/hero.webp`
- **Google Fonts**: Cambiado a patrón non-blocking preload+onload
- **PatapeteHero.tsx**: Hero local, price anchor con flex-wrap, badge más cerca del navbar en mobile

### Performance Optimizations (última sesión)
- **index.html**:
  - Eliminado preload incorrecto a Supabase (imagen vieja del hero)
  - Agregado `<link rel="preload" as="image" href="/tapete-mockup.webp" fetchpriority="high">` → fix LCP
  - Agregado `<link rel="preload" as="image" href="/demos/icono-0.webp">` → demo siempre visible
  - Google Fonts: `display=swap` → `display=optional` → elimina font-swap CLS
- **CanvasPreview.tsx**: Agregado `fetchPriority="high"` + `loading="eager"` + `width={2048}` + `height={2048}` al tapete-mockup img → fix LCP discovery
- **ProductSocialProof.tsx**: 5 imágenes de reseñas optimizadas 896×1200 → 399×534:
  - Total: ~965KB → ~227KB (76% reducción)
  - Nuevas URLs en Supabase product-images bucket
  - Agregados `width`, `height`, `decoding="async"` para prevenir CLS
  - Fondo `bg-muted` en contenedor para evitar layout shift durante carga

## PageSpeed Baseline (pre-optimización, mobile)
- Performance: 44
- FCP: 3.7s
- LCP: 9.3s
- CLS: 0.366
- Speed Index: 5.8s

## Known Issues Fixed
- **Stars/rating row invisible**: tailwind-merge fix en PageTemplate
- **Price anchor mobile overflow**: flex-wrap items-baseline fix
- **Badge demasiado abajo en mobile**: pt-8 pb-14 fix
- **Preload apuntando a URL incorrecta**: Eliminado, reemplazado con assets correctos

## Key Files
- `src/templates/PageTemplate.tsx` - Layout wrapper con pt-20 pb-6
- `src/components/patapete/configurator/StepPets.tsx` - Configurador principal
- `src/components/patapete/PatapeteHero.tsx` - Hero de landing
- `src/components/patapete/ProductSocialProof.tsx` - Testimonios con imágenes optimizadas
- `src/components/patapete/configurator/CanvasPreview.tsx` - Preview del tapete (LCP)
- `public/hero.webp` - Hero image optimizada localmente
- `/tapete-mockup.webp` - Rug mockup 2048×2048 (servido desde public/)
- `/demos/icono-0.webp` etc. - Demo pet illustrations (servidos desde public/)

## Architecture Notes
- 95% del tráfico real es Desktop (PostHog data)
- Configurador usa CanvasPreview sticky en desktop (top-20) y sticky en mobile (top-16)
- Sticky CTA bar aparece cuando el botón de CTA está fuera de vista