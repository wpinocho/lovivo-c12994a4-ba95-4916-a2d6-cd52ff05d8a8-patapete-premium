# Patapete Store — Plan

## Current State
Tienda ecommerce de tapetes personalizados con mascota (Patapete). El configurador principal está en `src/components/patapete/configurator/`.

## Recent Changes (Fase 3 — LCP Root Cause Fix)

### Fix LCP Gate (ProductPageUI) ✅
- **Root cause identificado**: El configurador (con el tapete) estaba oculto detrás de `if (logic.loading)` skeleton
- Flujo antes: React boot (~3s) → API Supabase (~4-5s) → aparece tapete = LCP 11.1s
- **Fix**: Detectar la URL del tapete via `useIsPatapetePage()` y renderizar `<PatapeteConfigurator product={null} />` inmediatamente
- Cuando la API responde, React reconcilia y pasa `product={logic.product}` real
- `handleAddToCart` y `handleOrderNow` ya tenían `if (!product) return` guards
- Impacto esperado: LCP ~4-5s (solo React boot time, no API wait)

### Fixes anteriores (Fase 3 Round 1)
- `public/tapete-mockup-sm.webp` (800×800, ~160KB) para móvil
- Vite manual chunks: vendor-react, vendor-radix, vendor-query, vendor-stripe, vendor-misc
- React.lazy() en 9 secciones del home y ProductSocialProof + ProductFAQ

## PageSpeed Progress
- **Antes fase 1**: 44 | FCP 3.7s | LCP 9.3s | CLS 0.366 | TBT 160ms | SI 5.8s
- **Después fase 2**: 58 | FCP 3.7s | LCP 9.7s | CLS 0 ✅ | TBT 220ms | SI 6.7s
- **Después fase 3 round 1**: 59 | FCP 4.2s | LCP 11.1s | TBT 110ms ✅ | CLS 0 ✅
- **Target**: 65-72 mobile

## Problemas pendientes en PageSpeed (imagen del usuario)
- ❗ **Mejorar entrega de imágenes — 406 KiB savings**: Demo icons + product images
- ❗ **Reduce JS no usado — 224 KiB**: Tree shaking / más code splitting  
- ❗ **Solicitudes que bloquean render — 190ms**: Posiblemente fonts o CSS
- ⚠️ **Minifica JS — 7 KiB**: Raro, Vite debería minificar
- ⚠️ **Elementos sin width/height — algunos**: CLS risk
- ⚠️ **JS antiguo — 41 KiB**: Build target config

## Known Issues Fixed
- **Stars/rating row invisible**: tailwind-merge fix en PageTemplate
- **Price anchor mobile overflow**: flex-wrap items-baseline fix
- **Badge demasiado abajo en mobile**: pt-8 pb-14 fix
- **Preload apuntando a URL incorrecta**: Eliminado, reemplazado con assets correctos
- **CLS 0.366 → 0**: Font swap + imagen reseñas fixes
- **LCP alto en móvil**: tapete-mockup 2048px → 800px para móvil (fase 3)
- **LCP 11.1s gate fix**: Configurador ahora renderiza antes de que API responda ✅

---

## Key Files
- `src/templates/PageTemplate.tsx` - Layout wrapper con pt-20 pb-6
- `src/components/patapete/configurator/StepPets.tsx` - Configurador principal
- `src/components/patapete/PatapeteHero.tsx` - Hero de landing
- `src/components/patapete/ProductSocialProof.tsx` - Testimonios con imágenes optimizadas
- `src/components/patapete/configurator/CanvasPreview.tsx` - Preview del tapete (LCP) — usa tapete-mockup-sm.webp en móvil
- `src/pages/ui/ProductPageUI.tsx` - `useIsPatapetePage()` hook + LCP gate fix
- `public/tapete-mockup-sm.webp` - Rug mockup 800×800 para móvil (~160KB)
- `public/hero.webp` - Hero image optimizada localmente
- `src/pages/ui/IndexUI.tsx` - lazy loading below-fold
- `vite.config.ts` - Manual chunks para vendor bundles

## Architecture Notes
- 95% del tráfico real es Desktop (PostHog data)
- Configurador usa CanvasPreview sticky en desktop (top-20) y sticky en mobile (top-16)
- Sticky CTA bar aparece cuando el botón de CTA está fuera de vista
- Lighthouse simula Moto G Power + 4G throttled (1.6 Mbps) — muy distinto del uso real
- **NOTA**: tapete-mockup.webp (2048×2048) NO está en git, existe solo en producción. tapete-mockup-sm.webp SÍ está en git.