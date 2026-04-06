# CRO Plan — Patapete

## Datos de conversión actuales (últimos 30 días)
- Pageviews: 2,111 (total) — 1,097 Mobile / 972 Desktop
- ⚠️ CONTAMINACIÓN: ~700+ sesiones Desktop vienen de lovivo.app y lovable.app (testing interno) — los números reales de clientes son mucho menores
- Usuarios reales (Facebook/Instagram): principalmente mobile

---

## ANÁLISIS COMPLETO DEL FUNNEL (usuarios únicos reales)

| Paso | Usuarios únicos | Drop |
|------|----------------|------|
| viewcontent | 873 | — |
| upload_zone_viewed | 237 | -73% 🔴 |
| photo_uploaded | 50 | -79% 🔴 |
| icon_generated | 50 | 0% ✅ |
| configurator_order_now | 13 | -74% 🔴 |
| initiatecheckout | 17 | -66% 🔴 |
| purchase | 2 | -88% 🔴 |

**Conversión total icon_generated → purchase: 4%** (catastrófico)

---

## HALLAZGOS CRÍTICOS

### 1. Los datos están muy contaminados con sesiones internas
- 631 visitas de lovivo.app, 105 de lovable.app = ~736 sesiones de testing
- De los 12 InitiateCheckout de Desktop, la mayoría son sesiones internas
- Solo 7 InitiateCheckout son usuarios reales móviles de Facebook/Instagram
- Esto significa que el funnel real de clientes pagos es aún más pequeño

### 2. El mayor drop: la gente NO llega a la zona de subida (73% drop)
- 873 vieron el producto pero 636 nunca hicieron scroll hasta el configurador
- La página tiene demasiado contenido antes del configurador
- El sticky CTA ayuda (68 taps registrados) pero no es suficiente

### 3. De los que suben foto, la conversión a generación es perfecta (100%)
- photo_uploaded → icon_generated: 50/50 usuarios = sin drop ✅
- El sistema de generación funciona perfectamente técnicamente

### 4. PATRÓN DEVASTADOR detectado en sesiones reales:
- Usuario genera ícono → toca "Ordenar" → entra a /pagar → **sale en <60 segundos** → vuelve al producto
- Esto se repite en MÚLTIPLES sesiones (019d5e75, 019d5cc4, 019d215c, 019d5c2d, 019d25d4)
- El tiempo promedio en /pagar antes de abandonar: 10-30 segundos
- Nadie completó el formulario en las sesiones estudiadas

### 5. El checkout móvil es el cuello de botella principal
- De 7 usuarios móviles reales que llegaron a initiatecheckout: 1 compró (14%)
- El tiempo en el checkout es muy bajo — sugiere que algo en el formulario los espanta
- Hipótesis: el formulario largo, solo tarjeta (sin OXXO/SPEI), o miedo al pago online

### 6. Sin remarketing visible
- Los usuarios que generan ícono y no compran... desaparecen
- No hay email capture antes de que se vayan
- No hay retargeting efectivo (o si lo hay, no convierte)

---

## DIAGNÓSTICO FINAL

**El problema NO es el diseño del ícono generado.** La gente genera el ícono con gusto.  
**El problema es la CONVERSIÓN POST-ÍCONO**, específicamente el checkout en mobile.

Los 3 problemas reales en orden de impacto:

1. 🔴 **Checkout móvil mata la venta** — El cliente entra, ve el formulario de tarjeta, sale en segundos. Sin OXXO/SPEI, pierdes a todos los que no quieren/pueden dar tarjeta online.

2. 🟠 **Sin cierre emocional fuerte después del ícono** — El cliente ve el ícono generado pero no visualiza el producto final (el tapete completo). No hay urgencia ni social proof en ese momento de alta intención.

3. 🟡 **73% no llega al configurador** — Aunque esto es un problema de tráfico/cold audience, reducir la fricción para llegar al configurador ayudaría al volumen.

---

## Cambios implementados ✅

### Paso 1 — Fix campo Colonia ✅
- **Archivo:** `src/pages/ui/CheckoutUI.tsx`
- Eliminado el campo "Apartamento, suite"
- Campo "Colonia" vinculado a `address.line2`

### Paso 2 — Traducir errores de pago al español ✅
- **Archivo:** `src/components/StripePayment.tsx`
- Todos los toasts traducidos al español

### Paso 3 — Trust Signals en Checkout ✅
- **Archivo:** `src/components/StripePayment.tsx`
- Leyenda compacta "Pago seguro encriptado con SSL" (sin banner verde gigante)
- Grid de 3 garantías debajo del botón
- Nota de política tranquilizadora

---

## PRÓXIMOS PASOS PRIORIZADOS

### P1 — CRÍTICO: OXXO y SPEI como métodos de pago
- **Impacto estimado: +20-40% conversión**
- Requiere modificar Edge Function `payments-create-intent` para soportar `oxxo` y `boleto`/bank transfer
- Frontend: `src/components/StripePayment.tsx` — agregar selección de método de pago
- Stripe soporta OXXO nativamente en México

### P2 — Cierre emocional post-generación
- Mostrar mockup del TAPETE COMPLETO con el ícono generado (no solo el ícono)
- Agregar: "¡Tu tapete personalizado está listo! 🎉" con más urgencia
- Agregar countdown de stock o "Última vez que alguien ordenó este estilo: hace X"
- Agregar mini reseñas/fotos de tapetes reales debajo del ícono

### P3 — Email capture antes de que abandonen
- Si el usuario generó un ícono pero no compra → popup de "Guarda tu diseño — te lo enviamos por email"
- Captura el email + el art_url del ícono generado
- Permite retargeting por email
- Requiere tabla Supabase para guardar leads

### P4 — Simplificar flujo de checkout móvil
- Reducir pasos del formulario (separar datos de envío vs pago en 2 pasos claros)
- Mostrar preview del tapete en el checkout para reforzar la decisión
- Agregar "¿Tienes dudas? Escríbenos por WhatsApp" en el checkout

---

## Archivos modificados
- `src/pages/ui/CheckoutUI.tsx`: Fix campo Colonia, h3 facturación condicional
- `src/components/StripePayment.tsx`: Trust signals compactos, todos los toasts en español