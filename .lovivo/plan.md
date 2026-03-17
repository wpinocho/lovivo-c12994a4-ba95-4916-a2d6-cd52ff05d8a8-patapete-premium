# Performance Fix — Patapete

## Estado: ✅ COMPLETADO (17 mar 2026)

## Diagnóstico (Lighthouse mobile 4G)
- FCP: 3.5s → objetivo < 1.8s
- LCP: 13.2s 🔴 → objetivo < 2.5s
- Speed Index: 7.0s
- Total Blocking Time: 120ms ✅
- CLS: 0 ✅

## Todos los fixes aplicados

### Fix 1 — Google Fonts non-blocking ✅
**Archivo:** `index.html`
Cambiado de `rel="stylesheet"` (render-blocking) al patrón `preload + onload`.
**Ahorro estimado: 1650ms en FCP.**

### Fix 2 — Hero img width/height ✅
**Archivo:** `src/components/patapete/PatapeteHero.tsx`
Agregado `width={1920}` y `height={1280}` al `<img>` del hero.

### Fix 3 — Imagen hero optimizada ✅
**Archivo:** `public/hero.webp`
Imagen optimizada de ~2MB+ a **170KB** (>90% reducción).
Ahora se sirve localmente desde `/hero.webp` en lugar de Supabase Storage (sin CDN).
`src` en PatapeteHero.tsx actualizado a `"/hero.webp"`.

## Bug fix — Precio en página de producto ✅
**Archivo:** `src/components/patapete/configurator/StepPets.tsx`
El precio estaba en una columna derecha (`sm:flex-row sm:justify-between`) con `text-3xl` cuyo ascendente subía hasta el área del navbar sticky (z-40 con pt-20 = 80px pero el texto grande se extendía hacia arriba).
**Fix:** Precio movido al flujo vertical normal, directamente debajo del título. Mejor jerarquía visual y eliminado el overlap con el header.

## Resultado esperado tras todos los fixes
- FCP: 3.5s → ~1.5-1.8s (fonts non-blocking + imagen local)
- LCP: 13.2s → ~2-3s (imagen optimizada 170KB servida localmente)
- Speed Index: mejora proporcional

## Notas de PostHog
- 95% visitas son Desktop
- Clientes mobile también se benefician de estos fixes