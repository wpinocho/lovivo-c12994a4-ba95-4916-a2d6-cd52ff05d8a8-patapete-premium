# Análisis CRO del Checkout — Patapete

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

## Problemas encontrados (priorizados por impacto)

### 🔴 CRÍTICO — Bug de código
**El campo "Colonia" está roto**
- Archivo: `src/pages/ui/CheckoutUI.tsx` línea ~359
- Código actual: `<Input id="colonia" placeholder="Colonia" />`
- No tiene `value` ni `onChange` → el campo no guarda datos ni los envía al backend
- Para usuarios mexicanos este campo es importante para su dirección
- Fix: Añadir state `colonia` y vincularlo al campo, luego incluirlo en `address.line2` o añadir campo `colonia` en el payload

### 🔴 CRÍTICO — Métodos de pago México
**Solo hay tarjeta. OXXO y SPEI no existen.**
- México tiene alta proporción de usuarios sin tarjeta de crédito
- OXXO Pay y SPEI son los métodos más usados en ecommerce mexicano
- Stripe soporta OXXO y SPEI nativamente con PaymentElement o como métodos específicos
- Impacto estimado: puede aumentar conversión 20-40% en México

### 🟠 ALTO — Errores de pago en inglés
- "Payment failed", "Items Out of Stock", "Error processing payment"
- En `src/components/StripePayment.tsx` líneas ~93, ~296, ~328, ~466
- Usuarios hispanohablantes no entienden los mensajes de error
- Fix: Traducir todos los strings de error

### 🟠 ALTO — Sin señales de confianza visuales
- Solo aparece el texto "🔒 Todas las transacciones son seguras y encriptadas."
- No hay badges de SSL, logos de Visa/MC/Stripe, ni calificaciones
- Recomendación: Agregar badges visuales de seguridad cerca del botón de pago

### 🟡 MEDIO — Formulario muy largo
- El checkout muestra TODOS los campos de una vez: email, nombre, apellido, país, dirección, complemento, colonia, CP, ciudad, estado, teléfono
- Alta carga cognitiva → usuarios se abruman y abandonan
- Mejora: Agrupar mejor visualmente (acordeones o progreso), o progressive disclosure

### 🟡 MEDIO — Sección "Dirección de facturación" visible innecesariamente
- La sección aparece aunque "Igual que la dirección de envío" esté seleccionada
- Solo muestra los radio buttons pero ocupa espacio visual valioso
- Fix: Colapsar completamente o quitar heading cuando no hay formulario extra

### 🟡 MEDIO — Campo "Colonia" (después del fix) no se incluye en address payload
- Actualmente `address.line2` es un campo opcional genérico
- Para México, colonia es campo distinto
- Al mandar al backend, debería ir en `line2` o nota interna

---

## Plan de implementación

### Paso 1 — Fix urgente: Campo Colonia
```tsx
// En CheckoutUI.tsx, añadir al estado del address o como campo standalone:
const [colonia, setColonia] = useState("")
// En el Input:
<Input 
  id="colonia" 
  value={colonia}
  onChange={e => setColonia(e.target.value)}
  placeholder="Colonia" 
/>
// Pasar colonia al shippingAddress como line2 si line2 está vacío, o concatenar
```

### Paso 2 — Traducir errores de pago
En `src/components/StripePayment.tsx`:
- "Payment failed" → "Pago fallido"
- "Stripe is not ready" → "El sistema de pago no está listo"
- "Items Out of Stock" → "Productos sin inventario"
- "Error processing payment" → "Error al procesar el pago"
- "Payment successful!" → "¡Pago exitoso!"
- "Your purchase has been processed successfully." → "Tu compra fue procesada exitosamente."
- "Please remove them from your cart to complete your order." → "Por favor elimínalos de tu carrito para completar tu compra."
- "Punto de recogida requerido" (ya en español ✓)

### Paso 3 — Confianza visual cerca del botón de pago
En `src/components/StripePayment.tsx`, debajo del botón o en el área de seguridad:
- Mejorar el texto de seguridad con iconos
- Añadir logos de métodos de pago aceptados (ya existe la imagen de tarjetas)
- Añadir texto "Pago seguro con Stripe" con logo

### Paso 4 — OXXO / SPEI (requiere configuración backend)
- Stripe soporta OXXO como `payment_method_types: ['oxxo']` en PaymentIntent
- SPEI como `payment_method_types: ['customer_balance']` con bank_transfer
- Requiere modificar la Edge Function `payments-create-intent` y el frontend
- En el frontend: usar `PaymentElement` de Stripe que automáticamente muestra los métodos disponibles
- Alternativa más rápida: mostrar botón OXXO separado que genera voucher

### Paso 5 — Mejorar layout del formulario
- Reducir espacio que ocupa la sección de facturación cuando es "mismo que envío"
- Considerar dividir en pasos (Contacto → Entrega → Pago)

---

## Archivos a modificar
- `src/pages/ui/CheckoutUI.tsx`: Fix campo Colonia, mejorar layout facturación
- `src/components/StripePayment.tsx`: Traducir errores, mejorar trust signals
- `supabase/functions/generate-tattoo/index.ts` o `payments-create-intent`: Añadir OXXO/SPEI (si existe)

## Prioridad de impacto esperado
1. Fix Colonia → reduce abandono por confusión (UX bug)
2. Errores en español → reduce confusión post-error
3. Trust signals → aumenta confianza ~5-10%
4. OXXO/SPEI → puede +20-40% conversión en Mexico