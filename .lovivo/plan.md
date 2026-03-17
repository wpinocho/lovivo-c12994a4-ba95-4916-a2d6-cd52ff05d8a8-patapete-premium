# Performance Fix — Patapete

## Estado: ✅ APLICADO (17 mar 2026)

## Diagnóstico (Lighthouse mobile 4G)
- FCP: 3.5s → objetivo < 1.8s
- LCP: 13.2s 🔴 → objetivo < 2.5s
- Speed Index: 7.0s
- Total Blocking Time: 120ms ✅
- CLS: 0 ✅

## Fixes aplicados

### Fix 1 — Google Fonts non-blocking ✅
**Archivo:** `index.html`
Cambiado de `rel="stylesheet"` (render-blocking) al patrón `preload + onload`:
```html
<link rel="preload" href="https://fonts.googleapis.com/css2?..." as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="..."></noscript>
```
**Ahorro estimado: 1650ms en FCP.**

### Fix 2 — Hero img width/height ✅
**Archivo:** `src/components/patapete/PatapeteHero.tsx`
Agregado `width={1920}` y `height={1280}` al `<img>` del hero para que el browser pre-calcule el espacio y evite layout shifts.

## Resultado esperado
- FCP: 3.5s → ~1.8-2.0s
- Speed Index: 7.0s → ~4-5s
- LCP: mejora marginal (cuello de botella sigue siendo tamaño/origen de imagen en Supabase Storage sin CDN global)

## Nota: LCP residual
LCP de 13.2s en mobile 4G es por la imagen hero pesada desde Supabase Storage (sin CDN global).
Para mejora drástica del LCP habría que comprimir imagen a <300KB o usar CDN como Cloudflare.
Por ahora los fixes aplicados son lo máximo posible sin cambiar hosting de imagen.

## Notas de PostHog
- 95% visitas son Desktop — clientes reales no sufren tanto como el test Lighthouse
- Hay visitas mobile que sí se benefician de estos fixes