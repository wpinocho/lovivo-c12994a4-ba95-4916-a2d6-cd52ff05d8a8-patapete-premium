# Patapete — Plan

## Current State
Ecommerce mexicano de tapetes personalizados con íconos de mascotas generados por IA. Stack: React/Vite/TS/Tailwind + Supabase custom backend.

## User Preferences
- Language: Spanish (Mexican)
- Keep it clean and simple, no overengineering
- CRO-first mindset

## Funnel Metrics (últimos 14 días, ~2026-04-06)
- Pageview → viewcontent: 463 → 440 (95%)
- viewcontent → photo_uploaded: 440 → 35 (**7.95% — bottleneck principal**)
- photo_uploaded → icon_generated: 35 → 35 (100% ✅)
- icon_generated → addtocart: 35 → 5 (14.29%)
- addtocart → initiatecheckout: 5 → 4 (80%)
- initiatecheckout → purchase: 4 → 0 (0% — posible problema técnico en checkout)

## Recent Changes

### Direct Charge Migration ✅ COMPLETADO (2026-04-07)
Migración de Destination Charges a Direct Charge en Stripe:

1. `src/lib/config.ts` — eliminado `LOVIVO_STRIPE_ACCOUNT_ID` (dead code)
2. `src/contexts/SettingsContext.tsx` — agregada query a `platform_stores` que lee `stripe_account_id` y `charge_type` dinámicamente; expuestos como `stripeAccountId` y `chargeType` en el contexto
3. `src/components/StripePayment.tsx` — props nuevas `stripeAccountId` y `chargeType`; `loadStripe` movido de módulo-level static a `useMemo` dentro del wrapper, pasando `{ stripeAccount }` cuando `chargeType === 'direct'`
4. `src/pages/ui/CheckoutUI.tsx` — importa `useSettings`, lee `stripeAccountId`/`chargeType`, los pasa a `<StripePayment>`

**NOTA**: La lógica de localStorage al completar pago NO se modificó (ya era más robusta que en el otro repo — busca imagen preview de patapete).

---

## Backlog CRO

### Priority 1: Banner/toast celebratorio después de icon_generated
**Files to modify**: `src/components/patapete/configurator/StepPets.tsx`

Cuando `icon_generated` sucede (pet.generatedArtUrl cambia de null a URL):
- Mostrar un floating banner muy visible por ~6 segundos
- Texto: "¡Tu tapete quedó increíble! 🐾 → Ordénalo ahora"
- Solo mostrar 1 vez por sesión (sessionStorage: 'patapete_cta_shown')
- Trackear PostHog: `post_generation_banner_shown` y `post_generation_banner_clicked`

### Priority 2 (backlog): Galería de ejemplos pre-upload
- Mini-galería de 2-3 ejemplos de tapetes generados ANTES del botón de upload
- Reduce ansiedad de "¿cómo va a quedar?"

### Priority 3 (backlog): Email capture post-generación
- Popup a los 2 min de haber generado sin comprar
- Requiere tabla en Supabase + edge function

## Próximos pasos
1. ✅ Fix Facebook Mobile bug → DESCARTADO
2. ✅ Direct Charge migration → COMPLETADO
3. Toast/banner celebratorio post icon_generated
4. Galería de ejemplos pre-upload
5. Email capture: popup cuando generó ícono pero no compró
6. OXXO/SPEI