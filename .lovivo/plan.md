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

## Precios actuales (producto en DB)
- Variantes 1/2/3 mascotas: **$799 MXN** (antes $949)
- Compare at: **$1,499 MXN** (antes $1,199)
- Hardcoded actualizado en: types.ts, PatapeteHero.tsx, StepPets.tsx

## Recent Changes

### Direct Charge Migration ✅ COMPLETADO (2026-04-07)
### Fix "No such payment_intent" ✅ COMPLETADO (2026-04-07)
### Banner celebratorio post-generación ✅ COMPLETADO (2026-04-07)
### OXXO + SPEI en Checkout ✅ COMPLETADO (2026-04-07)
### Actualización de precios ✅ COMPLETADO (2026-04-08)
- `types.ts`: PRICES 949 → 799
- `PatapeteHero.tsx`: "$949 MXN" → "$799 MXN", "$1,199" → "$1,499"
- `StepPets.tsx`: "$1,199 MXN" → "$1,499 MXN"
- StepSummary.tsx y StepStyle.tsx usan PRICES de types.ts (se actualizan automáticamente)

---

## OXXO + SPEI — Implementación completada

### Archivos modificados
1. **`src/lib/supabase.ts`** — Tipo `PaymentMethods` + campo `payment_methods?: PaymentMethods` en `StoreSettings`
2. **`src/contexts/SettingsContext.tsx`** — Fetch de `payment_methods` desde DB, expuesto como `paymentMethods` con default `{ card: true, oxxo: false, spei: false }`
3. **`src/components/StripePayment.tsx`** — Reescritura completa:
   - Nuevo componente `PaymentMethodSelector` (solo aparece si hay >1 método habilitado)
   - `selectedMethod` state (`'card' | 'oxxo' | 'spei'`)
   - `confirmCard` / `confirmOxxo` / `confirmSpei` como funciones internas con closure
   - OXXO: `stripe.confirmOxxoPayment` → sessionStorage → `/pago-pendiente/:orderId`
   - SPEI: `stripe.confirmCustomerBalancePayment` → sessionStorage → `/pago-pendiente/:orderId`
   - Payload incluye `payment_method: selectedMethod`
4. **`src/pages/PendingPayment.tsx`** — Página nueva con instrucciones OXXO (referencia + voucher) y SPEI (CLABE con copiar)
5. **`src/App.tsx`** — Ruta `/pago-pendiente/:orderId` agregada
6. **`src/pages/ui/CheckoutUI.tsx`** — `paymentMethods={paymentMethods}` pasado a `<StripePayment>`

### Habilitación en DB
Para activar OXXO o SPEI, actualizar `payment_methods` en `store_settings`:
```json
{ "card": true, "oxxo": true, "spei": false }
```

---

## PLAN ACTIVO: Usar `data.order` del edge como fuente de verdad ⏳

### Contexto
El edge `payments-create-intent` ahora devuelve un objeto `order` completo con:
- `order_number` real de DB (ej. "ORD-00001234")
- `shipping_address` con formato: `{ name, line1, line2, city, state, postal_code, country, phone }`
- `billing_address` mismo formato
- `order_items[]` con `{ product_name, product_images[], variant_name, quantity, price, total }`
- `total_amount`, `currency_code`, etc.

Actualmente el frontend construye `completedOrder` manualmente con datos del cliente que pueden ser incompletos o desincronizados.

### Cambios requeridos

#### 1. `src/components/StripePayment.tsx`

**A) Al inicio de `handleFinalizarCompra` (antes del try):**
- Declarar `let edgeOrderData: any = null` para que sea accesible desde los closures internos

**B) En el bloque ONE-TIME FLOW (después de `callEdge("payments-create-intent", payload)`):**
```typescript
const data = await callEdge("payments-create-intent", payload)
// Nueva línea: capturar y persistir el order del edge
edgeOrderData = data?.order ?? null
if (edgeOrderData && checkoutToken) {
  try {
    sessionStorage.setItem(`order_${checkoutToken}`, JSON.stringify(edgeOrderData))
  } catch { /* ignore */ }
}
```

**C) En `confirmCard` — reemplazar la construcción manual de `completedOrder`:**

Actualmente construye order_number como `orderId?.slice(-8).toUpperCase()` y mapea shipping_address manualmente desde props. Reemplazar con:

```typescript
// Build order_items: preferir edgeOrderData.order_items y mergear preview images
const orderItemsFromEdge: any[] = edgeOrderData?.order_items ?? []
const completedOrderItems = orderItemsFromEdge.length > 0
  ? orderItemsFromEdge.map((edgeItem: any) => {
      // Intentar obtener preview image de Patapete desde localStorage
      let productImages: string[] = edgeItem.product_images ?? []
      const rawItem = Array.isArray(items) ? items.find((it: any) =>
        (it.product_id || it.product?.id) === edgeItem.product_id &&
        (it.variant_id || it.variant?.id) === edgeItem.variant_id
      ) : undefined
      const itemKey = rawItem?.key
      if (itemKey) {
        try {
          const stored = localStorage.getItem(`patapete_customization:${itemKey}`)
          if (stored) {
            const parsed = JSON.parse(stored)
            const previewUrl = parsed.preview_image_url || parsed.preview_dataurl
            if (previewUrl) productImages = [previewUrl]
          }
        } catch { /* ignore */ }
      }
      return {
        product_id: edgeItem.product_id,
        variant_id: edgeItem.variant_id,
        product_name: edgeItem.product_name,
        variant_name: edgeItem.variant_name ?? '',
        quantity: edgeItem.quantity,
        price: edgeItem.price,  // ya en pesos (no centavos)
        product_images: productImages,
      }
    })
  : completedOrderItems  // fallback al cálculo manual anterior (mantener como fallback)

const completedOrder = {
  id: edgeOrderData?.id ?? orderId,
  order_number: edgeOrderData?.order_number ?? orderId?.slice(-8).toUpperCase() ?? 'N/A',
  checkout_token: edgeOrderData?.checkout_token ?? checkoutToken,
  total_amount: edgeOrderData?.total_amount ?? totalCents / 100,
  currency_code: (edgeOrderData?.currency_code ?? currency ?? 'mxn').toUpperCase(),
  status: 'paid',
  // Usar formato DB directo (name, line1, line2, city, state, postal_code, country, phone)
  shipping_address: edgeOrderData?.shipping_address ?? (shippingAddress ? {
    name: `${shippingAddress.first_name || ''} ${shippingAddress.last_name || ''}`.trim(),
    line1: shippingAddress.line1 || '',
    line2: shippingAddress.line2 || '',
    city: shippingAddress.city || '',
    state: shippingAddress.state || '',
    postal_code: shippingAddress.postal_code || '',
    country: shippingAddress.country || '',
    phone: phone || '',
  } : null),
  billing_address: edgeOrderData?.billing_address ?? null,
  order_items: completedOrderItemsFinal,
  created_at: new Date().toISOString(),
}
localStorage.setItem('completed_order', JSON.stringify(completedOrder))
```

**NOTA:** El fallback de `completedOrderItems` manual debe mantenerse por si `edgeOrderData` es null (ej. error de red). La lógica debe ser: intentar con edge data, si falla caer al cálculo manual actual.

Reorganizar el código de `confirmCard` en este orden:
1. Calcular `completedOrderItemsFinal` (edge items + preview images OR fallback manual)
2. Construir `completedOrder` usando edge data con fallbacks
3. Guardar en localStorage
4. `navigate('/gracias/${orderId}')`

#### 2. `src/pages/ThankYou.tsx`

**A) Agregar `callEdge` import de `@/lib/edge`**

**B) Cambiar `loadOrder` para hacer fetch a DB como fuente primaria:**

```typescript
const loadOrder = async () => {
  try {
    // 1. Leer localStorage inmediatamente (UX rápida)
    const localJson = localStorage.getItem('completed_order')
    const localOrder = localJson ? JSON.parse(localJson) : null
    if (localOrder) {
      setOrder(normalizeOrder(localOrder))
      localStorage.removeItem('completed_order')
    }

    // 2. Fetch de DB (fuente de verdad)
    try {
      const dbData = await callEdge('order-get', { order_id: orderId })
      if (dbData?.order) {
        setOrder(normalizeOrder(dbData.order))
      }
    } catch (dbErr) {
      console.warn('Could not fetch order from DB, using localStorage:', dbErr)
      // Si localStorage tampoco tenía nada, intentar sessionStorage
      if (!localOrder) {
        const sessionJson = sessionStorage.getItem(`order_${orderId}`)
        if (sessionJson) setOrder(normalizeOrder(JSON.parse(sessionJson)))
      }
    }
  } catch (error) {
    console.error('Error loading order:', error)
    setOrder(null)
  } finally {
    setLoading(false)
  }
}
loadOrder()
```

**C) Agregar función `normalizeOrder` que acepta ambos formatos:**
```typescript
// Normaliza tanto el formato DB (name, line1) como el formato legacy (first_name, address1)
const normalizeOrder = (raw: any): OrderDetails => ({
  ...raw,
  shipping_address: raw.shipping_address ? normalizeAddress(raw.shipping_address) : null,
  billing_address: raw.billing_address ? normalizeAddress(raw.billing_address) : null,
})

const normalizeAddress = (addr: any) => ({
  // Soporte para ambos formatos
  name: addr.name || `${addr.first_name || ''} ${addr.last_name || ''}`.trim(),
  line1: addr.line1 || addr.address1 || '',
  line2: addr.line2 || addr.address2 || '',
  city: addr.city || '',
  state: addr.state || addr.province || '',
  postal_code: addr.postal_code || addr.zip || '',
  country: addr.country || '',
  phone: addr.phone || '',
})
```

**D) Actualizar la interfaz `OrderDetails`:**
```typescript
interface ShippingAddress {
  name: string
  line1: string
  line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  phone?: string
}
interface OrderDetails {
  id: string
  order_number: string
  total_amount: number
  currency_code: string
  status: string
  shipping_address?: ShippingAddress
  billing_address?: ShippingAddress
  order_items: any[]
  created_at: string
}
```

**E) Actualizar el JSX de dirección para usar el formato normalizado:**
```tsx
<p>{order.shipping_address.name}</p>
<p>{order.shipping_address.line1}{order.shipping_address.line2 ? `, ${order.shipping_address.line2}` : ''}</p>
<p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}</p>
<p>{order.shipping_address.country}</p>
{order.shipping_address.phone && <p>Tel: {order.shipping_address.phone}</p>}
```

**F) Para order_items desde DB**, los campos son `price` (en pesos, no centavos) y `total`.
Verificar que `formatMoney(item.price * item.quantity, ...)` sea correcto — si DB devuelve `price` en pesos el cálculo está bien, si devuelve en centavos dividir entre 100. Según el payload del edge, `price: 500` = 500 MXN (pesos), así que el cálculo actual es correcto.

**G) Cambiar `useEffect` a `async` wrapper** (loadOrder ya es async).

### Archivos a modificar
- `src/components/StripePayment.tsx` — usar `edgeOrderData` en `confirmCard`, guardar en sessionStorage
- `src/pages/ThankYou.tsx` — fetch de DB, normalización de formato, fallback chain

### Orden de implementación
1. `ThankYou.tsx` primero (más independiente)
2. `StripePayment.tsx` después

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
4. ✅ OXXO + SPEI en checkout → COMPLETADO
5. ✅ Actualización de precios ($799 / $1,499) → COMPLETADO
6. ⏳ Usar `data.order` del edge como fuente de verdad (ThankYou + StripePayment)
7. Galería de ejemplos pre-upload
8. Email capture: popup cuando generó ícono pero no compró