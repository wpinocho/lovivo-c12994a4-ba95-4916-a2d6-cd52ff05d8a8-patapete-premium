# Fix: Mobile Checkout UX

## Problemas identificados (screenshot del usuario + análisis del código)

### 1. Botón "Completar Compra" — texto desbordado
**Archivo**: `src/components/StripePayment.tsx` línea 546
**Causa**: El texto generado es `"Completar Compra - MXN $949.00"` (~32 chars) con `text-lg font-semibold` en un botón full-width. En mobile (390px), los ~350px útiles no alcanzan para ese texto.
**Fix**: 
- Acortar a "Pagar – $949 MXN" en mobile, o mejor aún usar layout flex-col con dos spans:
  - Línea 1: "Completar Compra"
  - Línea 2 (más pequeño): "MXN $949.00"
- Alternativa más simple: cambiar a `text-base` en mobile con `text-sm sm:text-base` y truncar el label a `${cur} $${amt.toFixed(0)}` (sin decimales si son .00)

**Implementación**:
```tsx
// En el botón del PaymentForm:
{loading ? (
  <div className="flex items-center space-x-2">
    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
    <span>Procesando...</span>
  </div>
) : (
  <span className="flex flex-col items-center leading-tight">
    <span className="text-base font-semibold">Completar Compra</span>
    <span className="text-sm opacity-90">{amountLabel}</span>
  </span>
)}
```
Also fix amountLabel format: strip trailing .00 from whole numbers → `amt % 1 === 0 ? amt.toFixed(0) : amt.toFixed(2)`

### 2. Imagen del producto muy pequeña en order summary
**Archivo**: `src/pages/ui/CheckoutUI.tsx` línea 644
**Causa**: `w-16 h-16` (64px) es muy pequeña en mobile
**Fix**: Cambiar a `w-20 h-20` (80px) — mejor proporción visual

### 3. Mejoras adicionales de UX mobile (basadas en best practices Shopify 2024)

#### a. Order summary colapsable en mobile
Shopify colapsa el resumen en mobile por defecto para que el formulario sea lo primero. Actualmente nuestro checkout en mobile apila:
1. Formulario
2. Resumen (abajo del todo)

Esto significa que el usuario tiene que scrollear mucho. Propuesta: en mobile, poner un banner sticky arriba que muestre "Tapete Personalizado – $949" y se pueda expandir para ver el detalle.

#### b. Tamaño del botón de pago
El botón `h-12 text-lg` está bien en desktop pero en mobile con texto largo falla. El `h-12` puede reducirse a `h-11` o mantenerse si el texto se organiza en dos líneas.

## Archivos a modificar

### `src/components/StripePayment.tsx`
1. Línea 66-70: Modificar `amountLabel` para no mostrar decimales si son .00:
   ```tsx
   const amountLabel = useMemo(() => {
     const amt = (amountCents || 0) / 100
     const cur = (currency || "usd").toUpperCase()
     const formatted = amt % 1 === 0 ? amt.toFixed(0) : amt.toFixed(2)
     return `${cur} $${formatted}`
   }, [amountCents, currency])
   ```

2. Línea 534-548: Rediseñar el botón para layout flex-col en texto:
   ```tsx
   <Button 
     onClick={handleFinalizarCompra} 
     disabled={!stripe || loading || !amountCents}
     className="w-full h-auto py-3 text-base font-semibold"
     size="lg"
   >
     {loading ? (
       <div className="flex items-center space-x-2">
         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
         <span>Procesando...</span>
       </div>
     ) : (
       <span className="flex flex-col items-center gap-0.5 leading-tight">
         <span>Completar Compra</span>
         <span className="text-sm font-normal opacity-90">{amountLabel}</span>
       </span>
     )}
   </Button>
   ```

### `src/pages/ui/CheckoutUI.tsx`
1. Línea 644: Cambiar `w-16 h-16` a `w-20 h-20` en la imagen del producto del order summary
2. (Opcional) Agregar collapsible order summary header en mobile con total visible

## Prioridad
1. 🔴 CRÍTICO: Fix del botón desbordado (pérdida de conversión directa)
2. 🟡 IMPORTANTE: Imagen más grande (trust/UX)
3. 🟢 NICE TO HAVE: Collapsible order summary en mobile