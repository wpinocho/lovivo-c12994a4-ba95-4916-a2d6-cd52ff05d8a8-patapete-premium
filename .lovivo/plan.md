# Patapete Store - Plan

## Current State
Tienda de tapetes personalizados con fotos de mascotas. Pipeline de IA funcionando (Supabase edge functions, ~23-26s por generación).

## Recent Changes
- **Checkout mobile fixes** (2026-04-06):
  - Botón "Completar Compra": texto en 2 líneas (título + precio separado), sin decimales .00, h-auto para no cortar
  - Imagen producto en resumen: 64px → 80px (`w-20 h-20`)
  - Badge cantidad: colores de marca (`bg-primary text-primary-foreground`)
- Sticky bar de 3 estados (sin foto → procesando → listo)
- Badge animado "Generando tu retrato..." sobre preview mobile durante procesamiento

## ⚡ PENDING: Checkout Mobile Fix v2

### Problema 1: Stripe CardElement - texto encimado en mobile
**Causa**: `CardElement` (elemento unificado de Stripe) pone número + MM/AA + CVC + CP en una sola fila. En pantallas chicas (~360px), los campos se enciman y el texto del placeholder se superpone visualmente.

**Solución**: Reemplazar `CardElement` con elementos separados:
- `CardNumberElement` → fila completa (número de tarjeta)
- `CardExpiryElement` + `CardCvcElement` → lado a lado en una fila (50/50)
- CP opcional: dejar `CardNumberElement` y agregar campo postal si se necesita, o simplemente `hidePostalCode: true`

**Archivos a modificar**: `src/components/StripePayment.tsx`

#### Cambios técnicos:
1. Importar `CardNumberElement`, `CardExpiryElement`, `CardCvcElement` de `@stripe/react-stripe-js` en lugar de (o además de) `CardElement`
2. Reemplazar `<CardElement>` en el JSX por:
   ```jsx
   <div className="space-y-3">
     {/* Número de tarjeta */}
     <div className="border rounded-lg p-3 bg-background">
       <CardNumberElement options={cardElementOptions} />
     </div>
     {/* Expiración + CVC lado a lado */}
     <div className="grid grid-cols-2 gap-3">
       <div className="border rounded-lg p-3 bg-background">
         <CardExpiryElement options={cardElementOptions} />
       </div>
       <div className="border rounded-lg p-3 bg-background">
         <CardCvcElement options={cardElementOptions} />
       </div>
     </div>
   </div>
   ```
3. En `handleFinalizarCompra`, cambiar `elements.getElement(CardElement)` → `elements.getElement(CardNumberElement)`
4. En `stripe.confirmCardPayment`, la `card` ya funciona con `CardNumberElement` (Stripe las vincula automáticamente)
5. Opciones compartidas `cardElementOptions` con `fontSize: '16px'` y `hidePostalCode: true` (o si quieren CP, añadir fila separada)
6. Fix del header: el div "Tarjeta de crédito" + logos se aprieta. Añadir `flex-wrap gap-2` o `shrink-0` al logo para que el texto no se envuelva en 3 líneas.

### Problema 2: Imagen del producto sigue pequeña en checkout
**Causa**: Aunque está en `w-20 h-20` (80px), el tapete tiene orientación vertical/portrait y se ve chico dentro del contenedor.

**Solución**: Aumentar a `w-24 h-24` (96px) y mantener `object-cover rounded-lg`. Esto está en `CheckoutUI.tsx` línea ~648.

**Archivos a modificar**: `src/pages/ui/CheckoutUI.tsx`

#### Cambios técnicos:
- Línea 648: `className="w-20 h-20 object-cover rounded-lg border"` → `className="w-24 h-24 object-cover rounded-lg border"`

---

## User Preferences
- No mencionar "IA" en copy al usuario
- Mantener perro demo visible durante generación
- Idioma: español

## Known Issues
- Checkout mobile layout mejorado pero puede seguir revisándose en desktop