# Patapete — Plan

## Current State
Ecommerce mexicano de tapetes personalizados con íconos de mascotas generados por IA. Stack: React/Vite/TS/Tailwind + Supabase custom backend.

## User Preferences
- Language: Spanish (Mexican)
- Keep it clean and simple, no overengineering
- CRO-first mindset

## Funnel Metrics (últimos 7 días, ~2026-04-06)
- Pageview → viewcontent: 463 → 440 (95%)
- viewcontent → photo_uploaded: 440 → 35 (**7.95% — bottleneck principal**)
- photo_uploaded → icon_generated: 35 → 35 (100% ✅)
- icon_generated → addtocart: 35 → 5 (14.29%)
- addtocart → initiatecheckout: 5 → 4 (80%)
- initiatecheckout → purchase: 4 → 0 (0% — posible problema técnico en checkout)

## CRO Analysis — Session Data (2026-04-06)

### Hallazgo Crítico #1: Facebook Mobile NO puede subir fotos
- En session 019d6190: usuario tapea `sticky_cta_upload_tap` 8 veces en ~70 segundos sin que se abra el file picker ni se suba nada.
- El `input[type=file]` NO funciona en el Facebook in-app browser (WebView) — bug conocido de iOS/Android.
- ~19% de los visitantes usan Facebook Mobile browser. Este segmento tiene conversión CERO a photo_uploaded.
- **Fix necesario**: detectar Facebook webview y mostrar un mensaje pidiendo abrir en Chrome/Safari, O usar un fallback (camera API, deep link).

### Hallazgo Crítico #2: Post-generación no hay CTA visible/urgente
- Usuarios que generan ícono promedian 16 MINUTOS en la página (muy enganchados).
- avg_click_count = 0.0 — nadie está haciendo clic después de generar.
- Muchos generan 2-3 íconos (suben fotos múltiples veces) y luego se van.
- La sesión 019d5c2d llegó a /pagar y salió en 14 segundos — checkout muy rápido.
- **Hipótesis**: después de generar el ícono, el usuario no ve/siente un CTA lo suficientemente fuerte. El flujo actual los hace scrollear para encontrar el botón de ordenar.
- **Fix**: mostrar un mensaje/toast celebratorio inmediatamente después de `icon_generated` que lleve la atención al botón de ordenar.

### Datos de tráfico (web analytics)
- 95% mobile (487/592 pageviews)
- Fuentes: m.facebook.com (321), instagram.com (90) — 100% social paid
- /pagar: 22 vistas → 1 compra confirmada = 4.5% checkout conversion (muy bajo)
- Solo 1 página "/gracias" visitada = 1 sola compra esta semana

## Recent Changes
- `StepPets.tsx`: "Uploader First" redesign
  - Título cambiado a "Sube la foto de tu mascota y ve tu tapete antes de comprar"
  - Subtítulo "Gratis. En ~20 segundos. Solo pídelo si te encanta." en muted
  - Botón grande de upload aparece justo después del título (solo cuando !hasAnyPhoto)
  - Botones "Ordenar ahora" y "Agregar al carrito" se ocultan hasta que hay foto subida
  - Stars + rating en una sola línea (sin flex-wrap)
- `StripePayment.tsx`: Banner SSL discreto con ícono candado + trust badges

## Known Issues
- **CRÍTICO**: Facebook Mobile in-app browser no puede abrir file picker (input[type=file] broken)
- Checkout abandonment muy rápido (< 30s) — posible bug en mobile/webview
- Sin métodos de pago mexicanos (OXXO/SPEI)
- Sin email capture para retargeting
- Después de generar ícono no hay nudge/celebración → usuarios se van sin comprar

## Active Plan: Fix Facebook Mobile Upload + Post-Generation CTA

### Priority 1: Detectar Facebook WebView y mostrar aviso
**Files to modify**: `src/components/patapete/configurator/PhotoPetForm.tsx`

Detectar si el usuario está en Facebook/Instagram in-app browser:
```js
function isFacebookWebView() {
  const ua = navigator.userAgent || ''
  return /FBAN|FBAV|Instagram|FB_IAB/.test(ua)
}
```

Si isFacebookWebView() === true:
- En lugar del upload zone normal, mostrar un banner con mensaje:
  "Para subir tu foto, abre esta página en Chrome o Safari →"
- Botón que copia el URL y muestra instrucciones
- O mejor: mostrar el botón pero con instrucciones inline: "Toca y elige 'Abrir en Safari/Chrome'"
- Trackear evento `facebook_webview_detected`

Alternative approach: try to use `accept="image/*" capture=""` to trigger camera instead of file picker — works on some Facebook webview versions.

### Priority 2: Toast/CTA celebratorio post icon_generated
**Files to modify**: `src/components/patapete/configurator/StepPets.tsx`

Cuando `icon_generated` sucede (detectar cuando `pet.generatedArtUrl` cambia de null a URL):
- Mostrar un toast o banner en-page muy llamativo por ~5 segundos:
  "🎉 ¡Tu tapete quedó increíble! → Ordénalo ahora"
  Con botón directo al CTA de ordenar (scroll + vibración suave)
- Trackear evento `post_generation_cta_shown` y `post_generation_cta_clicked`

Implementation:
- Add `useEffect` watching `pets.some(p => p.generatedArtUrl)` transition
- When icon generates for first time: show a floating banner above the sticky bar for 5s
- Banner: fondo primary, texto blanco, botón "¡Ordenar ahora! $949 MXN →"
- Auto-dismiss after 5s or on click
- Only show once per session

### Priority 3 (backlog): Email capture post-generación
- Popup a los 2 min de haber generado sin comprar
- "Guarda tu diseño — te lo enviamos al correo"
- Requiere tabla en Supabase + edge function

## Próximos pasos (backlog)
1. Email capture: popup cuando generó ícono pero no compró en 2 min → "Guarda tu diseño"
2. OXXO/SPEI: Edge function con Stripe (posible desde Supabase conectado)
3. Validar checkout en mobile/webview Facebook (posible bug técnico)
4. Investigar por qué /pagar tiene 22 vistas pero solo 1 compra