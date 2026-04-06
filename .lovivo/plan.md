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

## Recent Changes
- `StepPets.tsx`: "Uploader First" redesign
  - Título cambiado a "Sube la foto de tu mascota y ve tu tapete antes de comprar"
  - Subtítulo "Gratis. En ~20 segundos. Solo pídelo si te encanta." en muted
  - Botón grande de upload aparece justo después del título (solo cuando !hasAnyPhoto)
  - Botones "Ordenar ahora" y "Agregar al carrito" se ocultan hasta que hay foto subida
  - Stars + rating en una sola línea (sin flex-wrap)
- `StripePayment.tsx`: Banner SSL discreto con ícono candado + trust badges

## Known Issues
- Checkout abandonment muy rápido (< 30s) — posible bug en mobile/webview de Facebook
- Sin métodos de pago mexicanos (OXXO/SPEI)
- Sin email capture para retargeting

## Active Plan: Uploader First (COMPLETADO)
1. ✅ Título "uploader first" 
2. ✅ Botón de upload inmediato antes del preview
3. ✅ Ocultar CTAs de compra hasta que hay foto
4. ✅ Stars en una sola línea en mobile

## Próximos pasos (backlog)
1. Email capture: popup cuando generó ícono pero no compró en 2 min → "Guarda tu diseño"
2. OXXO/SPEI: Edge function con Stripe (posible desde Supabase conectado)
3. Validar checkout en mobile/webview Facebook (posible bug técnico)