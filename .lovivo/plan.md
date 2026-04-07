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
### Fix "No such payment_intent" ✅ COMPLETADO (2026-04-07)
### Banner celebratorio post-generación ✅ COMPLETADO (2026-04-07)

---

## 🔧 EN PROGRESO: OXXO + SPEI en Checkout

### Objetivo
Agregar métodos de pago OXXO y SPEI (transferencia bancaria) al checkout de Stripe, controlados desde `store_settings.payment_methods` en la DB.

### Archivos a crear/modificar

#### 1. `src/lib/supabase.ts`
Agregar tipo `PaymentMethods` y añadirlo a `StoreSettings`:
```ts
export type PaymentMethods = {
  card?: boolean
  oxxo?: boolean
  spei?: boolean
}
// En StoreSettings:
payment_methods?: PaymentMethods
```

#### 2. `src/contexts/SettingsContext.tsx`
- Agregar `payment_methods` al `select` de la query a `store_settings`
- Exponer `paymentMethods: PaymentMethods` en el contexto con default `{ card: true, oxxo: false, spei: false }`
- Agregar `paymentMethods` a la interface `SettingsContextType`

#### 3. `src/components/StripePayment.tsx`
Este es el cambio principal. Modificaciones:

**a) Import nuevo:**
```ts
import { CreditCard, Store, Building2 } from "lucide-react"
import type { PaymentMethods } from "@/lib/supabase"
```

**b) Tipo local:**
```ts
type PaymentMethodType = 'card' | 'oxxo' | 'spei'
```

**c) Props nuevas en `StripePaymentProps`:**
```ts
paymentMethods?: PaymentMethods
```

**d) Nuevo componente interno `PaymentMethodSelector`:**
```tsx
function PaymentMethodSelector({ methods, selected, onChange }: {
  methods: PaymentMethodType[]
  selected: PaymentMethodType
  onChange: (m: PaymentMethodType) => void
}) {
  if (methods.length <= 1) return null
  const labels = { card: 'Tarjeta', oxxo: 'OXXO', spei: 'Transferencia SPEI' }
  const icons = { card: CreditCard, oxxo: Store, spei: Building2 }
  return (
    <div className="flex gap-2 mb-4">
      {methods.map(m => {
        const Icon = icons[m]
        return (
          <button key={m} onClick={() => onChange(m)}
            className={`flex-1 flex flex-col items-center gap-1 border rounded-lg p-3 text-sm font-medium transition-all
              ${selected === m ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}>
            <Icon className="w-5 h-5" />
            {labels[m]}
          </button>
        )
      })}
    </div>
  )
}
```

**e) En `PaymentForm`, lógica de métodos disponibles:**
```ts
const availableMethods = useMemo<PaymentMethodType[]>(() => {
  const methods: PaymentMethodType[] = []
  if (!paymentMethods || paymentMethods.card !== false) methods.push('card')
  if (paymentMethods?.oxxo) methods.push('oxxo')
  if (paymentMethods?.spei) methods.push('spei')
  return methods.length > 0 ? methods : ['card']
}, [paymentMethods])
const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>(availableMethods[0])
```

**f) Payload incluye `payment_method`:**
```ts
payment_method: selectedMethod, // 'card' | 'oxxo' | 'spei'
```

**g) Validaciones por método (antes de procesar):**
- card: valida que exista `CardNumberElement`
- oxxo/spei: valida que `name` y `email` estén presentes

**h) Flujo de confirmación ramificado:**
```ts
if (selectedMethod === 'card') await confirmCard(clientSecret)
else if (selectedMethod === 'oxxo') await confirmOxxo(clientSecret)
else if (selectedMethod === 'spei') await confirmSpei(clientSecret)
```

**i) `confirmOxxo` function:**
```ts
const confirmOxxo = async (clientSecret: string) => {
  const result = await stripe!.confirmOxxoPayment(clientSecret, {
    payment_method: { billing_details: { name: name!, email: email! } }
  })
  if (result.error) {
    toast({ title: 'Error', description: result.error.message, variant: 'destructive' })
    return
  }
  const pi = result.paymentIntent
  if (pi?.status === 'requires_action' && (pi as any).next_action?.oxxo_display_details) {
    const oxxo = (pi as any).next_action.oxxo_display_details
    sessionStorage.setItem('pending_payment', JSON.stringify({
      method: 'oxxo',
      reference: oxxo.number,
      hosted_voucher_url: oxxo.hosted_voucher_url,
      expires_at: oxxo.expires_at,
      amount: (pi.amount / 100),
      currency: pi.currency?.toUpperCase(),
      order_id: orderId
    }))
    clearCart()
    navigate(`/pago-pendiente/${orderId}`)
  }
}
```

**j) `confirmSpei` function:**
```ts
const confirmSpei = async (clientSecret: string) => {
  const result = await stripe!.confirmCustomerBalancePayment(clientSecret, {
    payment_method: { type: 'customer_balance' },
    payment_method_options: {
      customer_balance: {
        funding_type: 'bank_transfer',
        bank_transfer: { type: 'mx_bank_transfer' }
      }
    }
  })
  if (result.error) {
    toast({ title: 'Error', description: result.error.message, variant: 'destructive' })
    return
  }
  const pi = result.paymentIntent
  const speiAddress = (pi as any)?.next_action?.display_bank_transfer_instructions?.financial_addresses?.find(
    (fa: any) => fa.type === 'spei'
  )
  sessionStorage.setItem('pending_payment', JSON.stringify({
    method: 'spei',
    clabe: speiAddress?.spei?.clabe,
    bank_name: speiAddress?.spei?.bank_name,
    hosted_instructions_url: (pi as any)?.next_action?.display_bank_transfer_instructions?.hosted_instructions_url,
    amount: ((pi?.amount ?? 0) / 100),
    currency: pi?.currency?.toUpperCase(),
    order_id: orderId
  }))
  clearCart()
  navigate(`/pago-pendiente/${orderId}`)
}
```

**k) JSX condicional:**
- Siempre renderizar `<PaymentMethodSelector>` encima del formulario
- Mostrar el formulario de tarjeta (`CardNumberElement`, `CardExpiryElement`, `CardCvcElement`) solo cuando `selectedMethod === 'card'`
- Para oxxo/spei, solo mostrar mensaje breve (ej: "Ingresa tu nombre y correo arriba para continuar") — los datos ya se capturan de los props `name` y `email`

#### 4. `src/pages/PendingPayment.tsx` — NUEVO archivo
Página completa para instrucciones post-pago OXXO/SPEI:
```tsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { BrandLogoLeft } from '@/components/BrandLogoLeft'
import { Copy, Check, ExternalLink } from 'lucide-react'

export default function PendingPayment() {
  const { orderId } = useParams()
  const [data, setData] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  
  useEffect(() => {
    const raw = sessionStorage.getItem('pending_payment')
    if (raw) setData(JSON.parse(raw))
  }, [])
  
  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  if (!data) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Información de pago no encontrada</p>
    </div>
  )
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <BrandLogoLeft />
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        {data.method === 'oxxo' && <OxxoInstructions data={data} />}
        {data.method === 'spei' && <SpeiInstructions data={data} copyToClipboard={copyToClipboard} copied={copied} />}
      </main>
    </div>
  )
}
```

**OxxoInstructions**: muestra referencia, monto, fecha expiración (unix timestamp → fecha legible), botón para ver voucher (`hosted_voucher_url` abre en nueva pestaña).

**SpeiInstructions**: muestra CLABE con botón copiar, banco, monto, botón para ver instrucciones completas (`hosted_instructions_url`).

#### 5. `src/App.tsx`
Agregar ruta y lazy import:
```ts
const PendingPayment = lazyWithReload(() => import('./pages/PendingPayment'))
// En Routes:
<Route path="/pago-pendiente/:orderId" element={<PendingPayment />} />
```

#### 6. `src/pages/ui/CheckoutUI.tsx`
```ts
const { paymentMethods } = useSettings()
// Pasar a StripePayment:
<StripePayment
  // ... props existentes
  paymentMethods={paymentMethods}
/>
```

### Requisitos del backend (payments-create-intent edge function)
> **NOTA:** Este cambio NO está en el repo de Lovivo — es responsabilidad del backend de Lovivo. El frontend envía `payment_method: 'card' | 'oxxo' | 'spei'` en el payload. El backend debe:
> - `'card'`: flujo normal → PaymentIntent con `payment_method_types: ['card']`
> - `'oxxo'`: PaymentIntent con `payment_method_types: ['oxxo']`
> - `'spei'`: crear Customer si no existe + PaymentIntent con `payment_method_types: ['customer_balance']` + `payment_method_options.customer_balance.funding_type: 'bank_transfer'` + `payment_method_options.customer_balance.bank_transfer.type: 'mx_bank_transfer'`

### Habilitación en DB
Para activar OXXO o SPEI para la tienda, el campo `payment_methods` en `store_settings` debe ser:
```json
{ "card": true, "oxxo": true, "spei": false }
```

---

## Backlog CRO

### Priority 1 (backlog): Galería de ejemplos pre-upload
- Mini-galería de 2-3 ejemplos de tapetes generados ANTES del botón de upload

### Priority 2 (backlog): Email capture post-generación
- Popup a los 2 min de haber generado sin comprar

## Próximos pasos
1. ✅ Direct Charge migration → COMPLETADO
2. ✅ Fix "No such payment_intent" → COMPLETADO
3. ✅ Banner celebratorio post icon_generated → COMPLETADO
4. 🔧 OXXO + SPEI en checkout → EN PROGRESO
5. Galería de ejemplos pre-upload
6. Email capture: popup cuando generó ícono pero no compró