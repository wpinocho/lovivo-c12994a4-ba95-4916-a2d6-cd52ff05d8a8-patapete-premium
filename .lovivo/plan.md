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
- initiatecheckout → purchase: 4 → 0 (0% — bug de checkout corregido)

## Recent Changes

### Direct Charge Migration ✅ COMPLETADO (2026-04-07)
Migración de Destination Charges a Direct Charge en Stripe:

1. `src/lib/config.ts` — eliminado `LOVIVO_STRIPE_ACCOUNT_ID` (dead code)
2. `src/contexts/SettingsContext.tsx` — agregada query a `platform_stores` que lee `stripe_account_id` y `charge_type` dinámicamente; expuestos como `stripeAccountId` y `chargeType` en el contexto
3. `src/components/StripePayment.tsx` — props nuevas `stripeAccountId` y `chargeType`; `loadStripe` movido de módulo-level static a `useMemo` dentro del wrapper, pasando `{ stripeAccount }` cuando `chargeType === 'direct'`
4. `src/pages/ui/CheckoutUI.tsx` — importa `useSettings`, lee `stripeAccountId`/`chargeType`, los pasa a `<StripePayment>`

### Fix "No such payment_intent" ✅ COMPLETADO (2026-04-07)
Race condition: `platform_stores` query llegaba tarde → Stripe se inicializaba sin `stripeAccount` → PaymentIntent creado en cuenta conectada no se encontraba en cuenta plataforma.

**Fix aplicado:**
1. `src/contexts/SettingsContext.tsx` — expuesto `isPlatformStoreLoading: boolean` (del `isLoading` del useQuery de `platform_stores`)
2. `src/pages/ui/CheckoutUI.tsx` — la sección de Pago muestra un skeleton `animate-pulse h-48` mientras `isPlatformStoreLoading === true`; solo monta `<StripePayment>` cuando el dato ya está disponible

**Por qué funciona:** Stripe Elements se monta una sola vez con el `stripeAccount` correcto desde el primer render. No hay race condition ni re-mount.

---

### Banner celebratorio post-generación ✅ COMPLETADO (2026-04-07)
**Objetivo:** Empujar conversión icon_generated → addtocart (actualmente 14.29%)

**Implementado en:** `src/components/patapete/configurator/StepPets.tsx`

**Lógica:**
- `useEffect` detecta cuando `pet.generatedArtUrl` cambia de `null` a una URL
- Solo muestra 1 vez por sesión (`sessionStorage: 'patapete_cta_shown'`)
- Floating card animada (`slide-in-from-bottom-4`) posicionada encima del sticky bar (`bottom-24 z-60`)
- Auto-dismiss después de 6 segundos
- Botón "Ordenar →" llama `validateAndProceed('order')` directamente
- Botón X para cerrar manualmente
- Tracking PostHog: `post_generation_banner_shown` + `post_generation_banner_clicked`

---

## Backlog CRO

### Priority 1 (backlog): Galería de ejemplos pre-upload
- Mini-galería de 2-3 ejemplos de tapetes generados ANTES del botón de upload
- Reduce ansiedad de "¿cómo va a quedar?"

### Priority 2 (backlog): Email capture post-generación
- Popup a los 2 min de haber generado sin comprar
- Requiere tabla en Supabase + edge function

## Próximos pasos
1. ✅ Fix Facebook Mobile bug → DESCARTADO
2. ✅ Direct Charge migration → COMPLETADO
3. ✅ Fix "No such payment_intent" → COMPLETADO
4. ✅ Banner celebratorio post icon_generated → COMPLETADO
5. Galería de ejemplos pre-upload
6. Email capture: popup cuando generó ícono pero no compró
7. OXXO/SPEI