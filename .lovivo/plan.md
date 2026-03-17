# Performance Fix Round 2 — Patapete

## Diagnóstico (Lighthouse mobile 4G, 17 mar 2026)
- FCP: 3.5s (debería ser < 1.8s)
- LCP: 13.2s 🔴 (debería ser < 2.5s)
- Speed Index: 7.0s
- Total Blocking Time: 120ms ✅
- CLS: 0 ✅

## Causa raíz identificada

### Problema 1 — Google Fonts SIGUE siendo render-blocking
En `index.html` línea 11 existe `<link rel="stylesheet" href="https://fonts.googleapis.com">`.
Aunque quitamos el @import del CSS, el `<link rel="stylesheet">` en el HTML es igualmente render-blocking.
El browser detiene todo el renderizado hasta que descargue ese CSS externo.
**Ahorro estimado: 1650ms en FCP.**

### Problema 2 — Hero image LCP de 13.2s
La imagen hero está en Supabase Storage (sin CDN global) y probablemente pesa varios MB.
Aunque tiene `fetchpriority="high"` y `decoding="sync"` + preload, en 4G lenta sigue siendo lenta.
Además, el `<img>` no tiene atributos `width` y `height`, lo que impide que el browser optimice.
El preload URL en index.html SÍ coincide con el src del img — eso está bien.

## Fixes a implementar

### Fix 1 — Google Fonts no-blocking (index.html)
Cambiar el `<link rel="stylesheet">` de Google Fonts por el patrón "print swap":

```html
<!-- Reemplazar la línea actual: -->
<link href="https://fonts.googleapis.com/..." rel="stylesheet">

<!-- Por este patrón non-blocking: -->
<link rel="preload" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"></noscript>
```

### Fix 2 — Hero image: agregar width/height + loading eager
En `src/components/patapete/PatapeteHero.tsx`, al `<img>` del hero agregar:
- `width={1920}` `height={1280}` (o las dimensiones reales de la imagen)
- Confirmar que `loading="eager"` está implícito (no agregar lazy)
- Mantener `fetchPriority="high"` y `decoding="sync"` que ya están

### Fix 3 — CSS bundle: defer non-critical styles (opcional)
El /assets/index-C9lvuwnD.css de 18.5 KiB es el bundle de Tailwind. No podemos eliminarlo fácilmente,
pero si Fix 1 ya resuelve el bloqueo, esto puede no ser necesario.

## Archivos a modificar
- `index.html` — Fix 1: Google Fonts non-blocking
- `src/components/patapete/PatapeteHero.tsx` — Fix 2: width/height en hero img

## Impacto esperado
- FCP: 3.5s → ~1.8-2.0s (eliminando bloqueo de fonts)
- LCP: mejora marginal (el cuello de botella principal es el tamaño/origen de la imagen)
- Speed Index: 7.0s → ~4-5s

## Nota sobre LCP
El LCP de 13.2s en mobile 4G es extremo porque la imagen pesa mucho y viene de Supabase Storage
sin CDN global. Para una mejora drástica del LCP habría que:
1. Comprimir la imagen hero a <300KB
2. O usar Vercel Image Optimization (si se configura next/image o similar)
Por ahora los fixes 1 y 2 son lo que se puede hacer sin cambiar el hosting de la imagen.

## Estado
🔧 PENDIENTE — aplicar en Craft Mode