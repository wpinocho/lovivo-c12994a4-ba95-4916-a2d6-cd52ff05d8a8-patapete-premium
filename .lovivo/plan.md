# CRO Plan — Patapete

## Datos de conversión actuales (últimos 30 días)
- Pageviews: 2,098 (52% mobile / 46% desktop)
- AddToCart: 23
- InitiateCheckout: 88 (mobile: 18 / desktop: 70)
- Purchase: 3 (mobile: 1 / desktop: 2)
- **Tasa checkout → compra: 3.4%** (industria: 50-70%)
- Mobile representa el 52% del tráfico pero solo el 20% de los checkouts

---

## Cambios implementados ✅

### Paso 1 — Fix campo Colonia ✅
- **Archivo:** `src/pages/ui/CheckoutUI.tsx`
- Eliminado el campo "Apartamento, suite"
- Campo "Colonia" vinculado a `address.line2`

### Paso 2 — Traducir errores de pago al español ✅
- **Archivo:** `src/components/StripePayment.tsx`
- Todos los toasts traducidos al español

### Paso 3 — Trust Signals visuales en Checkout ✅
- **Archivo:** `src/components/StripePayment.tsx`
- **Banner SSL verde** — reemplazó el emoji 🔒 invisible. Ahora tiene: ícono candado verde, "Pago 100% seguro · Encriptado SSL", logos Visa/Mastercard SVG inline
- **Grid de 3 garantías** debajo del botón "Completar Compra":
  - 🛡️ Garantía Patapete — reponemos sin costo si llega con defecto
  - 🚚 Envío gratis — a todo México incluido
  - 🔄 Sin complicaciones — ¿Problema? Lo resolvemos
- **Nota de política** abajo del T&C: "¿Dudas con tu pedido? Contáctanos y lo resolvemos. Sin letra pequeña."

---

## 🔴 CRÍTICO — Métodos de pago México (siguiente paso grande)
**Solo hay tarjeta. OXXO y SPEI no existen.**
- Impacto estimado: puede aumentar conversión 20-40% en México
- Requiere modificar Edge Function `payments-create-intent` y frontend StripePayment.tsx

---

## Archivos modificados
- `src/pages/ui/CheckoutUI.tsx`: Fix campo Colonia, h3 facturación condicional
- `src/components/StripePayment.tsx`: Trust signals visuales completos, todos los toasts en español

## Próximo paso sugerido
1. OXXO/SPEI (siguiente) → expansión del mercado alcanzable en México (+20-40% conversión estimado)
2. Reducir fricción del formulario largo — mostrar campos progresivamente