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

## PageSpeed Progress
- **Antes**: 44 | FCP 3.7s | LCP 9.3s | CLS 0.366 | TBT 160ms | SI 5.8s
- **Ahora**: 58 | FCP 3.7s | LCP 9.7s | CLS 0 ✅ | TBT 220ms | SI 6.7s
- **Target**: 68-72 mobile (máximo alcanzable sin SSR para React SPA)

## Known Issues Fixed
- **Stars/rating row invisible**: tailwind-merge fix en PageTemplate
- **Price anchor mobile overflow**: flex-wrap items-baseline fix
- **Badge demasiado abajo en mobile**: pt-8 pb-14 fix
- **Preload apuntando a URL incorrecta**: Eliminado, reemplazado con assets correctos
- **CLS 0.366 → 0**: Font swap + imagen reseñas fixes

---

## NEXT OPTIMIZATION PLAN — Fase 3 (Target: 68-72)

### Root Cause Analysis
- **LCP 9.7s** (peso crítico): `tapete-mockup.webp` es 2048×2048 → en móvil se muestra en ~350px → el archivo es probablemente 600KB-1MB descargando en 4G throttled (~1.6Mbps) = 3-5s solo de descarga AFTER FCP
- **FCP 3.7s**: React SPA → todo el JS bundle debe descargar + ejecutar antes de que React pinte algo. Main bundle tiene ~258KB de código no usado.
- **TBT 220ms**: Bundle monolítico sin splitting → long tasks en el main thread
- **Images 1075 KiB**: Mainly el tapete-mockup + posibles imágenes adicionales

### Fix 1: tapete-mockup más pequeño para móvil (MAYOR IMPACTO en LCP)
**Estrategia**: Crear `/tapete-mockup-sm.webp` (800×800, target <150KB) para móvil.
En `index.html`, preload condicional:
```html
<link rel="preload" as="image" href="/tapete-mockup-sm.webp" media="(max-width: 768px)" fetchpriority="high">
<link rel="preload" as="image" href="/tapete-mockup.webp" media="(min-width: 769px)" fetchpriority="high">
```
En `CanvasPreview.tsx`, detectar mobile y usar imagen más pequeña:
```tsx
const isMobile = window.innerWidth < 768
const TAPETE_URL = isMobile ? '/tapete-mockup-sm.webp' : '/tapete-mockup.webp'
```
**PROBLEMA**: No tenemos la imagen pequeña aún. Opciones:
- A) User provee versión reducida
- B) En Craft Mode, generarla via Canvas API y guardarla como blob (no persiste entre builds)
- C) Usar el mismo `/tapete-mockup.webp` pero hacer `image-rendering: optimizeSpeed` + CSS `image-size: 800px`
- **MEJOR OPCIÓN**: Subir `tapete-mockup.webp` a Supabase Storage bucket `product-images` y usar transform URL `?width=800&quality=80&format=webp` para móvil. Esto NO requiere archivo nuevo.

### Fix 2: Vite Manual Chunks (impacto en TBT y cache)
En `vite.config.ts`, agregar rollup manual chunks para separar vendor bundles:
```ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', /* etc */],
        'vendor-query': ['@tanstack/react-query'],
        'vendor-stripe': ['@stripe/react-stripe-js', '@stripe/stripe-js'],
      }
    }
  }
}
```
Esto divide el bundle monolítico en chunks cacheables separados → parallel download → mejor FCP en visitas recurrentes.

### Fix 3: Lazy load below-fold en ProductPageUI (reduce initial JS)
En `src/pages/ui/ProductPageUI.tsx`, cambiar imports a lazy:
```tsx
const ProductSocialProof = lazy(() => import('@/components/patapete/ProductSocialProof').then(m => ({ default: m.ProductSocialProof })))
const ProductFAQ = lazy(() => import('@/components/patapete/ProductFAQ').then(m => ({ default: m.ProductFAQ })))
```
Ambas secciones están below the fold (debajo del configurador). Esto reduce el JS que se descarga y ejecuta en el primer render.
Agregar Suspense wrapper con fallback skeleton alrededor de ambas.

### Fix 4: Lazy load Index page heavy sections
En `src/pages/ui/IndexUI.tsx`, los componentes below-fold también pueden ser lazy:
- PatapeteTestimonials, PatapeteTransformation, PatapeteGallery, PatapeteBenefits, PatapeteGiftSection, PatapetePersonalization, PatapeteMaterials, PatapeteFAQ, PatapeteFinalCTA
- Los above-fold (PatapeteHero, PatapeteTrustStrip, PatapeteHowItWorks) se mantienen síncronos

### Fix 5: Agregar sizes en imágenes del configurador
En `CanvasPreview.tsx`, los `<img>` de las mascotas no tienen `sizes` attribute. Agregar `sizes="(max-width: 768px) 100px, 200px"` para que el browser descargue el tamaño correcto.

### Fix 6: react-intersection-observer lazy sections
Ya existe `useInView` en ProductPageUI. Podemos diferir el renderizado de ProductSocialProof hasta que entre en viewport:
```tsx
const { ref, inView } = useInView({ triggerOnce: true, rootMargin: '200px' })
{inView && <ProductSocialProof />}
```

## Implementation Priority
1. **Fix 1** (Supabase transform URL para tapete-mockup) → +8 pts LCP
2. **Fix 2** (Vite manual chunks) → +4 pts TBT/FCP  
3. **Fix 3** (Lazy load social proof + FAQ) → +3 pts
4. **Fix 6** (IntersectionObserver for social proof) → +2 pts

## Files to Modify
- `vite.config.ts`: Add build.rollupOptions.output.manualChunks
- `src/pages/ui/ProductPageUI.tsx`: Lazy load ProductSocialProof + ProductFAQ + useInView defer
- `index.html`: Update preload with media queries (when small mockup is available)
- `src/components/patapete/configurator/CanvasPreview.tsx`: Use Supabase transform URL on mobile

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
- Lighthouse simula Moto G Power + 4G throttled (1.6 Mbps) — muy distinto del uso real