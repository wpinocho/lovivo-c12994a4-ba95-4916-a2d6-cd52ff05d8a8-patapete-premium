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
- Varios mensajes de error traducidos al español

---

## 🔴 PENDIENTE — Trust Signals en Checkout (ALTA PRIORIDAD)

### Problema actual
El código muestra solo: `🔒 Todas las transacciones son seguras y encriptadas.`
Esto es invisible y no genera confianza. Las capturas confirman que casi no se ve.

### Qué implementar en `src/components/StripePayment.tsx`

#### 1. Reemplazar la línea 🔒 (líneas 498-501) por un banner visual real:
```tsx
{/* Trust banner visual — reemplaza el texto simple */}
<div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 flex items-center gap-3">
  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
    <svg ... /> {/* candado verde */}
  </div>
  <div className="flex-1 min-w-0">
    <p className="text-xs font-bold text-green-800">Pago 100% seguro · Encriptado SSL</p>
    <p className="text-xs text-green-700">Procesado por Stripe — el estándar mundial de pagos seguros</p>
  </div>
  {/* logos tarjetas pequeños aquí */}
</div>
```

#### 2. Agregar bloque de garantía + envío DEBAJO del botón "Completar Compra" (entre el botón y el texto de T&C):
```tsx
{/* Trust pack — justo debajo del botón de pago */}
<div className="grid grid-cols-3 gap-2">
  <div> 🛡️ Garantía Patapete — reponemos sin costo si llega con defecto </div>
  <div> 🚚 Envío gratis a todo México incluido </div>
  <div> 🔒 Datos protegidos con encriptación SSL </div>
</div>
```

Use `ShieldCheck`, `Truck`, `Lock` icons from lucide-react.
Make the grid items: icon + short bold label + tiny description.
Style: `bg-muted/40 rounded-xl py-2 px-2 text-center text-[11px]`

#### 3. Pequeña nota de política debajo del texto de T&C:
```
"¿Problemas con tu pedido? Contáctanos y lo resolvemos. Sin letra pequeña."
```
Con un link a WhatsApp o correo.

### Archivos a modificar
- `src/components/StripePayment.tsx`: Reemplazar trust section, agregar grid de garantías debajo del botón

### Resultado esperado
- Banner verde SSL visible y llamativo antes del formulario de tarjeta
- Grid de 3 badges (garantía / envío gratis / seguridad) debajo del botón de compra
- Mensajes todos en español y en tono Patapete (cálido, directo)

---

## 🔴 CRÍTICO — Métodos de pago México (siguiente paso grande)
**Solo hay tarjeta. OXXO y SPEI no existen.**
- Impacto estimado: puede aumentar conversión 20-40% en México
- Requiere modificar Edge Function `payments-create-intent` y frontend StripePayment.tsx

---

## Archivos modificados
- `src/pages/ui/CheckoutUI.tsx`: Fix campo Colonia, h3 facturación condicional
- `src/components/StripePayment.tsx`: Trust signals (pendiente mejora visual real)

## Próximo paso sugerido
1. Trust signals visuales (AHORA) → mejora inmediata en conversión
2. OXXO/SPEI (siguiente) → expansión del mercado alcanzable