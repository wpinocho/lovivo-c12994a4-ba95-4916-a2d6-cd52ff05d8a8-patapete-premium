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
### OXXO + SPEI en Checkout ✅ COMPLETADO (2026-04-07)

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

### Flujo
```
store_settings.payment_methods → SettingsContext → CheckoutUI → StripePayment
                                                                    │
                                         ┌──────────────────────────┤
                                       card         oxxo          spei
                                         │            │              │
                                    /gracias/   /pago-pendiente/  /pago-pendiente/
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
4. ✅ OXXO + SPEI en checkout → COMPLETADO
5. Galería de ejemplos pre-upload
6. Email capture: popup cuando generó ícono pero no compró