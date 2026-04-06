# CRO Plan — Patapete

## Datos de conversión actuales (últimos 30 días)
- Pageviews: 2,098 (52% mobile / 46% desktop)
- AddToCart: 23
- InitiateCheckout: 88 (mobile: 18 / desktop: 70)
- Purchase: 3 (mobile: 1 / desktop: 2)
- **Tasa checkout → compra: 3.4%** (industria: 50-70%)
- Mobile representa el 52% del tráfico pero solo el 20% de los checkouts

## Device breakdown en checkout:
- Desktop Chrome Windows: 70 sesiones
- Mobile Chrome Android: 14 sesiones
- Mobile Facebook Browser iOS: 4 sesiones (tráfico desde anuncios en FB/IG)

---

## Cambios implementados ✅

### Paso 1 — Fix campo Colonia ✅
- **Archivo:** `src/pages/ui/CheckoutUI.tsx`
- Eliminado el campo "Apartamento, suite" (poco usado en México)
- Campo "Colonia" ahora vinculado a `address.line2` con value + onChange
- El valor se envía al backend correctamente

### Paso 2 — Traducir errores de pago al español ✅
- **Archivo:** `src/components/StripePayment.tsx`
- "Stripe is not ready" → "El sistema de pago no está listo. Recarga la página."
- "Items Out of Stock" → "Productos sin inventario" (3 ocurrencias: subs, one-time, catch)
- "Please remove them from your cart" → "Por favor elimínalos de tu carrito para continuar."
- "Payment failed" → "Pago fallido"
- "Error processing payment" → "Error al procesar el pago. Verifica los datos de tu tarjeta."
- "Payment successful!" → "¡Pago exitoso!"
- "Your purchase has been processed successfully." → "Tu compra fue procesada exitosamente. ¡Gracias!"
- "Payment status" → "Estado del pago"

### Paso 3 — Trust signals visuales ✅
- **Archivo:** `src/components/StripePayment.tsx`
- Reemplazado el texto simple de seguridad por un banner visual con:
  - Ícono de candado verde + "Pago 100% seguro · Encriptado con SSL"
  - Logos de tarjetas aceptadas (Visa/MC imagen existente)
  - Badge "Stripe" visible
- La sección de "Dirección de facturación" ahora oculta el h3 cuando useSameAddress=true

---

## Problemas pendientes (priorizados por impacto)

### 🔴 CRÍTICO — Métodos de pago México
**Solo hay tarjeta. OXXO y SPEI no existen.**
- México tiene alta proporción de usuarios sin tarjeta de crédito
- OXXO Pay y SPEI son los métodos más usados en ecommerce mexicano
- Stripe soporta OXXO y SPEI nativamente con PaymentElement o como métodos específicos
- Impacto estimado: puede aumentar conversión 20-40% en México
- Requiere modificar Edge Function `payments-create-intent` y frontend

### 🟡 MEDIO — Formulario muy largo
- El checkout muestra TODOS los campos de una vez
- Alta carga cognitiva → usuarios se abruman y abandonan
- Mejora: Agrupar mejor visualmente (acordeones o progreso), o progressive disclosure

---

## Archivos modificados
- `src/pages/ui/CheckoutUI.tsx`: Fix campo Colonia, h3 facturación condicional
- `src/components/StripePayment.tsx`: Traducir errores, trust signals mejorados

## Próximo paso sugerido
- OXXO/SPEI (requiere config backend Stripe + Edge Function)