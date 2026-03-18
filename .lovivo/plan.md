# Patapete — Plan de Optimización

## Estado Actual
- PageSpeed móvil: ~58 (objetivo: 65-72)
- PageSpeed desktop: objetivo 85-90
- CLS: 0 ✅

## Optimizaciones Implementadas

### Fix 1 — LCP (tapete-mockup)
- Imagen reducida de 2048px a optimizado
- Preload único en index.html (fetchpriority="high")

### Fix 2 — JS Bloqueante
- Chunks Vite configurados: React, Radix UI, Stripe separados
- Descargas paralelas + mejor caché

### Fix 3 — Lazy Loading
- React.lazy() en 9 secciones del home
- Testimonios/FAQ del producto también lazy

### Fix 4 — LCP Crítico (configurador)
- Desacoplada carga del configurador de llamada API Supabase
- Imagen aparece inmediatamente, botones se activan cuando llegan datos

### Fix 5 — Imágenes optimizadas en repo ✅ (más reciente)
- `public/tapete-mockup.webp` → imagen optimizada del cliente (318KB), sirve tanto móvil como desktop
- `public/tapete-mockup-sm.webp` → misma imagen (redundante, se puede limpiar luego)
- `public/demos/icono-0.webp` → 23KB (era ~48KB)
- `public/demos/icono-1.webp` → 19KB
- `public/demos/icono-2.webp` → 18KB
- Iconos ya vienen con fondo transparente → eliminado flood-fill innecesario en demos
- `canvasCompositing.ts`: `needsBgRemoval` solo aplica a `isGenerated && !isDemo`
- `CanvasPreview.tsx`: URL única de tapete, sin split móvil/desktop
- `index.html`: Preload simplificado a un solo archivo

## Próximos Pasos Posibles
- Medir PageSpeed tras deploy del Fix 5
- Considerar further compression del tapete-mockup.webp (318KB → objetivo <200KB)
- Revisar otras imágenes pesadas en páginas de colecciones/home