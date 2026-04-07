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

---

## 🐛 BUG ACTIVO: "No such payment_intent" en checkout con Direct Charges

### Root Cause (confirmado por logs)
- `SettingsContext` tiene DOS queries async: `store_settings` y `platform_stores`
- La query `platform_stores` (que trae `stripe_account_id` y `charge_type`) es async y llega tarde
- Cuando `CheckoutUI` monta `<StripePayment>`, `stripeAccountId` es `null` (todavía loading)
- `useMemo` en `StripePayment` crea `loadStripe(PK, {})` sin `stripeAccount` → inicializado en cuenta PLATAFORMA
- Cuando la BD responde con el account ID, React intenta actualizar la prop `stripe` de `<Elements>` → Stripe SDK lanza warning: **"You cannot change the `stripe` prop after setting it"** (log #9) → la instancia NO se actualiza
- El PaymentIntent se crea en la cuenta CONECTADA (edge function lo hace bien), pero `stripe.confirmCardPayment()` lo busca en la cuenta PLATAFORMA → **"No such payment_intent"** (log #10)

### Fix Plan

#### Opción elegida: Gate render de `<StripePayment>` hasta que platform store esté cargado

**Files to modify:**

1. **`src/contexts/SettingsContext.tsx`**
   - Exponer `isPlatformStoreLoading: boolean` en el contexto (la query de `platform_stores` tiene su propio loading state)
   - En el `useQuery` de `platform_stores`, destructurar también `isLoading: isPlatformStoreLoading`
   - Agregar `isPlatformStoreLoading` al interface `SettingsContextType` y al valor del Provider

2. **`src/pages/ui/CheckoutUI.tsx`**
   - Importar `isPlatformStoreLoading` de `useSettings()`
   - En la sección de Pago (section con `<StripePayment>`), no renderizar hasta que `isPlatformStoreLoading === false`
   - Mostrar un spinner/skeleton simple mientras carga (e.g., div con animate-pulse h-32)
   - Esto garantiza que cuando `<Elements stripe={stripePromise}>` monta por primera vez, ya tiene el `stripeAccountId` correcto

**Implementation steps:**

```tsx
// SettingsContext.tsx — en el useQuery de platform_stores:
const { data: platformStore, isLoading: isPlatformStoreLoading } = useQuery({ ... })

// Agregar al interface:
isPlatformStoreLoading: boolean

// En CheckoutUI.tsx — en la sección de Pago:
{isPlatformStoreLoading ? (
  <div className="animate-pulse rounded-lg bg-muted h-48" />
) : (
  <StripePayment ... />
)}
```

**Why this works:** Stripe Elements se monta una sola vez cuando `stripeAccountId` ya tiene el valor correcto desde la BD. No hay race condition.

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
3. 🐛 Fix "No such payment_intent" — gate render de StripePayment hasta que platform_stores esté cargado
4. Toast/banner celebratorio post icon_generated
5. Galería de ejemplos pre-upload
6. Email capture: popup cuando generó ícono pero no compró
7. OXXO/SPEI