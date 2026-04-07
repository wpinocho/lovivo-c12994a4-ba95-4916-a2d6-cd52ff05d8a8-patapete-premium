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

## Active Plan: Direct Charge Migration

### Objetivo
Migrar el checkout de Destination Charges a Direct Charge en Stripe, igual que en el otro repo. Esto permite que el pago se procese directamente en la cuenta del merchant.

### Estado actual vs cambios requeridos

#### 1. `src/lib/config.ts` — CAMBIO SIMPLE
**Estado actual**: Tiene `LOVIVO_STRIPE_ACCOUNT_ID = 'acct_1Rk9SNP66p9BDoW4'`
**Acción**: Eliminar esa constante. Solo dejar `STORE_ID` y `STRIPE_PUBLISHABLE_KEY`.

```ts
// Resultado final:
export const STORE_ID = 'c12994a4-ba95-4916-a2d6-cd52ff05d8a8'
export const STRIPE_PUBLISHABLE_KEY = 'pk_live_51Rk9SNP66p9BDoW4lgxDnuqvNZYEaL400FCX0GStvuaslkEMBZNRqln5M5bDcBSBmFmR7hlY0pDcA4u4VIi8CRIg00KkqRzlVs'
```

#### 2. `src/contexts/SettingsContext.tsx` — CAMBIO MEDIO
**Estado actual**: Solo query a `store_settings`. No expone `stripeAccountId` ni `chargeType`.
**Acción**: Agregar segunda query a `platform_stores` y exponer las dos variables nuevas en el contexto.

Cambios:
- Agregar a `SettingsContextType`: `stripeAccountId: string | null` y `chargeType: string | null`
- Agregar `useQuery` para `platform_stores`:
```ts
const { data: platformStore } = useQuery({
  queryKey: ['platform-store', STORE_ID],
  queryFn: async () => {
    const { data } = await supabase
      .from('platform_stores')
      .select('stripe_account_id, charge_type')
      .eq('store_id', STORE_ID)
      .eq('status', 'ready')
      .maybeSingle()
    return data
  },
  staleTime: 60000,
  retry: 1,
})
const stripeAccountId = platformStore?.stripe_account_id || null
const chargeType = platformStore?.charge_type || null
```
- Agregar `stripeAccountId` y `chargeType` al value del Provider

#### 3. `src/components/StripePayment.tsx` — CAMBIO IMPORTANTE
**Estado actual**:
- `loadStripe` es estático en la raíz del módulo (línea 37): `const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)`
- Props no incluyen `stripeAccountId` ni `chargeType`
- El payload a `payments-create-intent` NO incluye `payment_method` (campo)
- El localStorage save al completar pago ya existe pero con lógica diferente (busca en patapete_customization)

**Acción**:
a) Agregar props al interface:
```ts
stripeAccountId?: string | null
chargeType?: string | null
```

b) Eliminar el static `const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)` de línea 37.

c) En el wrapper `export default function StripePayment(props)`, mover loadStripe a useMemo dinámico:
```ts
export default function StripePayment(props: StripePaymentProps) {
  const stripePromise = useMemo(() => {
    const opts = props.chargeType === 'direct' && props.stripeAccountId
      ? { stripeAccount: props.stripeAccountId }
      : {}
    return loadStripe(STRIPE_PUBLISHABLE_KEY, opts)
  }, [props.stripeAccountId, props.chargeType])
  
  if (!stripePromise) {
    return <div className="text-sm text-muted-foreground">Error: No se pudo cargar Stripe.</div>
  }
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  )
}
```

d) En `PaymentForm`, también recibir `stripeAccountId` y `chargeType` en los props destructurados (aunque no se usen directamente en el form, deben estar en la interfaz).

e) En el payload de `payments-create-intent`, agregar `use_stripe_connect: false` cuando es direct charge (o simplemente dejar que el backend lo maneje según charge_type). Por ahora, mantener `use_stripe_connect: true` pero esto puede necesitar ajuste según el backend.

**NOTA**: El cambio de localStorage al completar la compra ya existe en este repo con una implementación más robusta (busca en patapete_customization y hace fallback a product images). NO sobreescribir con la versión simplificada del otro repo.

#### 4. `src/pages/ui/CheckoutUI.tsx` — CAMBIO SIMPLE
**Estado actual**: No importa `useSettings`, no pasa `stripeAccountId`/`chargeType` a `<StripePayment>`.
**Acción**:
- Importar `useSettings` de `@/contexts/SettingsContext`
- Llamarlo dentro de `CheckoutUI` (fuera del render prop de HeadlessCheckout):
```ts
const { stripeAccountId, chargeType } = useSettings()
```
- Pasar como props al componente `<StripePayment>`:
```tsx
<StripePayment
  stripeAccountId={stripeAccountId}
  chargeType={chargeType}
  // ...resto de props existentes
/>
```

### Files to modify
1. `src/lib/config.ts` — eliminar LOVIVO_STRIPE_ACCOUNT_ID
2. `src/contexts/SettingsContext.tsx` — agregar query platform_stores + exponer stripeAccountId/chargeType
3. `src/components/StripePayment.tsx` — props nuevas + loadStripe dinámico en wrapper
4. `src/pages/ui/CheckoutUI.tsx` — useSettings + pasar props a StripePayment

### Prioridad
Alta — afecta directamente los pagos

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
2. ✅ Direct Charge migration → SIGUIENTE (plan listo arriba)
3. Toast/banner celebratorio post icon_generated
4. Galería de ejemplos pre-upload
5. Email capture: popup cuando generó ícono pero no compró
6. OXXO/SPEI