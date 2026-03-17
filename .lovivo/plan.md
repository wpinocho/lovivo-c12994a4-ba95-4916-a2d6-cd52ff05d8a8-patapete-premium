# Patapete Store — Plan

## Current State
Tienda ecommerce de tapetes personalizados con mascota (Patapete). El configurador principal está en `src/components/patapete/configurator/`.

## Recent Changes (Fase 3 — Performance Round 2)

### Fix 1: tapete-mockup responsive para LCP móvil ✅
- Creado `public/tapete-mockup-sm.webp` (800×800, ~160KB) desde la imagen de producción (2048×2048)
- `CanvasPreview.tsx`: Detecta mobile via `window.innerWidth < 768` y usa `tapete-mockup-sm.webp` en móvil
- `index.html`: Preload condicional con media queries:
  ```html
  <link rel="preload" as="image" href="/tapete-mockup-sm.webp" media="(max-width: 767px)" fetchpriority="high">
  <link rel="preload" as="image" href="/tapete-mockup.webp" media="(min-width: 768px)" fetchpriority="high">
  ```
- Impacto esperado: -3 a -4s en LCP móvil

### Fix 2: Vite Manual Chunks ✅
- `vite.config.ts`: Agregado `build.rollupOptions.output.manualChunks`:
  - `vendor-react`: react, react-dom, react-router-dom
  - `vendor-radix`: todos los @radix-ui packages
  - `vendor-query`: @tanstack/react-query
  - `vendor-stripe`: @stripe packages
  - `vendor-misc`: date-fns, recharts, embla-carousel-react
- Impacto esperado: -50ms TBT, mejor cache entre visitas

### Fix 3: React.lazy() en ProductPageUI y IndexUI ✅
- `ProductPageUI.tsx`: ProductSocialProof + ProductFAQ → `lazy()` + `<Suspense>` con skeleton
- `IndexUI.tsx`: 9 secciones below-fold → `lazy()` + `<Suspense>` con SectionSkeleton genérico
  - Sync (above fold): PatapeteHero, PatapeteTrustStrip, PatapeteHowItWorks, PatapeteWhatsApp
  - Lazy: Testimonials, Transformation, Gallery, Benefits, GiftSection, Personalization, Materials, FAQ, FinalCTA
- Impacto esperado: -80-120KB JS ejecutado en initial load → mejora FCP y TBT

## PageSpeed Progress
- **Antes fase 1**: 44 | FCP 3.7s | LCP 9.3s | CLS 0.366 | TBT 160ms | SI 5.8s
- **Después fase 2**: 58 | FCP 3.7s | LCP 9.7s | CLS 0 ✅ | TBT 220ms | SI 6.7s
- **Target fase 3**: 65-72 mobile

## Known Issues Fixed
- **Stars/rating row invisible**: tailwind-merge fix en PageTemplate
- **Price anchor mobile overflow**: flex-wrap items-baseline fix
- **Badge demasiado abajo en mobile**: pt-8 pb-14 fix
- **Preload apuntando a URL incorrecta**: Eliminado, reemplazado con assets correctos
- **CLS 0.366 → 0**: Font swap + imagen reseñas fixes
- **LCP alto en móvil**: tapete-mockup 2048px → 800px para móvil (fase 3)

---

## Key Files
- `src/templates/PageTemplate.tsx` - Layout wrapper con pt-20 pb-6
- `src/components/patapete/configurator/StepPets.tsx` - Configurador principal
- `src/components/patapete/PatapeteHero.tsx` - Hero de landing
- `src/components/patapete/ProductSocialProof.tsx` - Testimonios con imágenes optimizadas
- `src/components/patapete/configurator/CanvasPreview.tsx` - Preview del tapete (LCP) — usa tapete-mockup-sm.webp en móvil
- `public/tapete-mockup-sm.webp` - Rug mockup 800×800 para móvil (~160KB)
- `public/hero.webp` - Hero image optimizada localmente
- `src/pages/ui/IndexUI.tsx` - lazy loading below-fold
- `src/pages/ui/ProductPageUI.tsx` - lazy loading ProductSocialProof + ProductFAQ
- `vite.config.ts` - Manual chunks para vendor bundles

## Architecture Notes
- 95% del tráfico real es Desktop (PostHog data)
- Configurador usa CanvasPreview sticky en desktop (top-20) y sticky en mobile (top-16)
- Sticky CTA bar aparece cuando el botón de CTA está fuera de vista
- Lighthouse simula Moto G Power + 4G throttled (1.6 Mbps) — muy distinto del uso real
- **NOTA**: tapete-mockup.webp (2048×2048) NO está en git, existe solo en producción. tapete-mockup-sm.webp SÍ está en git (copiado en esta sesión).