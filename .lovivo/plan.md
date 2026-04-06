# CRO Plan — Patapete

## Datos de conversión actuales (últimos 14 días)

### Funnel por dispositivo (14 días — TODOS los eventos, incluyendo testing interno)
| Evento | Mobile | Desktop (mayoría testing) |
|--------|--------|---------------------------|
| icon_generated | 83 | 11 |
| configurator_order_now | 13 (15.7%) | 25 |
| initiatecheckout | 18 (21.7%) | 45 |
| addtocart | 8 (9.6%) | 16 |
| purchase | 1 (1.2%) | 0 |

### Fuentes de traffic mobile (icon_generated últimos 14 días)
- Chrome Mobile: 64 sesiones
- Facebook Mobile browser: 12 sesiones
- Mobile Safari (iOS): 7 sesiones

---

## HALLAZGO CRÍTICO NUEVO — Checkout móvil posiblemente ROTO

Revisando las sesiones reales de clientes de Facebook/patapete.com:

**Sesión 019d215c (Mobile Chrome, patapete.com):**
- 20:23:15 → toca "Ordenar" → entra a /pagar
- 20:23:48 → VUELVE al producto (en 33 segundos!)
- 20:23:56 → toca "Ordenar" SEGUNDA VEZ → entra a /pagar
- 20:24:01 → VUELVE al producto (en 5 segundos!)
- 20:24:26 → toca "Ordenar" TERCERA VEZ → entra a /pagar
- Sesión termina en /pagar

**3 intentos de compra en 70 segundos** — esto NO es falta de ganas. Es que ALGO en el checkout no funciona en mobile.

**Sesión 019d5e75 (Mobile Chrome, Facebook ad):**
- 16:29:06 → entra a /pagar → vuelve en 10 segundos
- 16:30:14 → entra a /pagar SEGUNDA VEZ → vuelve en 54 segundos
- Sigue en la página del producto 28 minutos más
- Vuelve 1 hora después y se va sin comprar

**Sesión 019d5cc4 (Mobile Chrome, Facebook ad):**
- Entra a /pagar → vuelve en 5 minutos

### Hipótesis del problema:
El checkout en mobile puede tener un problema técnico donde:
1. Stripe Elements no carga correctamente en el WebView de Facebook
2. El formulario se ve pero los inputs no son interactuables
3. La carga de Stripe.js falla en conexiones lentas de mobile
4. O simplemente el formulario es tan pesado/intimidante que salen inmediatamente

### DATO ALARMANTE:
- click_count: 0.0 en TODAS las sesiones → PostHog no está capturando clicks
- Esto significa que no podemos ver con qué hacen tap en el checkout
- Necesitamos activar session recordings o agregar tracking de clicks explícito

---

## FUNNEL 7 DÍAS (de la imagen del usuario)
- Pageview: 463 → viewcontent: 440 (95%) → photo_uploaded: 35 (7.95%) → icon_generated: 35 (100%) → addtocart: 5 (14.29%) → initiatecheckout: 4 (80%) → purchase: 0 (0%)

Los % entre pasos intermedios se ven bien:
- viewcontent → photo_uploaded: 7.95% (cold audience, normal)
- photo_uploaded → icon_generated: 100% ✅
- icon_generated → addtocart: 14.29% (hay oportunidad)
- addtocart → initiatecheckout: 80% ✅
- **initiatecheckout → purchase: 0% 🚨 CRÍTICO**

---

## DIAGNÓSTICO FINAL ACTUALIZADO

**El problema principal es el checkout en mobile — potencialmente roto, no solo con fricción de UX.**

### Prioridad 1 — INVESTIGAR Y ARREGLAR el checkout mobile
Antes de agregar OXXO/SPEI o email capture, necesitamos saber si el checkout funciona:

**Acción inmediata:** Hacer una prueba real en mobile (pasar por todo el flujo en un teléfono real desde el link de Facebook) y ver qué pasa cuando llegas a /pagar.

Posibles causas técnicas:
- Stripe.js no carga en Facebook WebView
- El endpoint de pago falla silenciosamente
- Hay un error en el formulario que no se muestra al usuario

### Prioridad 2 — OXXO/SPEI (requiere Edge Function propia)
Dado que el backend de pagos es de Lovivo (checkout-create → payments-create-intent), podemos crear un flujo alternativo de OXXO directamente:
- Nueva Edge Function en Supabase del usuario: `create-oxxo-intent`
  - Llama a Stripe API con `payment_method_types: ['oxxo']`
  - Regresa `client_secret` del PaymentIntent
- Frontend: `src/components/StripePayment.tsx`
  - Selector de método de pago (Tarjeta | OXXO | SPEI)
  - Cuando OXXO seleccionado: llama a `create-oxxo-intent` y usa `OxxoElement` de Stripe
  - OXXO no necesita número de tarjeta — solo email del cliente
  - Stripe genera cupón imprimible → cliente paga en OXXO en 3 días

**Archivos a modificar para OXXO:**
- `supabase/functions/create-oxxo-intent/index.ts` (nuevo)
- `src/components/StripePayment.tsx` (agregar selector + flujo OXXO)
- Secreto en Supabase: `STRIPE_SECRET_KEY` (via supabase_create_secrets en Craft Mode)

### Prioridad 3 — Email capture post-generación
Popup que aparece si el usuario generó ícono pero no tocó "Ordenar" en 2 minutos:
- "¿Te gustó el ícono de [nombre mascota]? Guarda tu diseño"
- Capturar email + art_url generado
- Requiere tabla Supabase: `patapete_leads(id, email, art_url, created_at)`
- Archivo a modificar: `src/components/patapete/configurator/StepPets.tsx` o crear `EmailCaptureModal.tsx`
- Activar desde `PatapeteConfigurator.tsx` con timer después de `icon_generated`

### Prioridad 4 — Más CTA después del ícono
El 85% de móviles que generan ícono NO tocan "Ordenar". Después del ícono necesitamos:
- Mensaje más emocionante: "¡Tu tapete está listo! 🎉"
- Mostrar un mockup rápido del tapete completo (no solo el ícono)
- CTA más grande y urgente: "🚀 Pedir ahora por $299" (con precio visible)
- Countdown: "Genera tu tapete en menos de X días"

---

## Cambios implementados ✅

### Paso 1 — Fix campo Colonia ✅
- **Archivo:** `src/pages/ui/CheckoutUI.tsx`
- Eliminado el campo "Apartamento, suite"
- Campo "Colonia" vinculado a `address.line2`

### Paso 2 — Traducir errores de pago al español ✅
- **Archivo:** `src/components/StripePayment.tsx`

### Paso 3 — Trust Signals en Checkout ✅
- **Archivo:** `src/components/StripePayment.tsx`
- Leyenda compacta "Pago seguro encriptado con SSL"
- Grid de 3 garantías debajo del botón

---

## PRÓXIMA ACCIÓN RECOMENDADA

**Antes de código:** El usuario debe probar manualmente el checkout en su teléfono, específicamente:
1. Abrir patapete.com desde el browser de Facebook (como lo hacen sus clientes)
2. Subir foto → generar ícono → tocar "Ordenar"  
3. Ver qué pasa en /pagar — ¿carga bien? ¿aparece el formulario? ¿se pueden tocar los campos?

Si confirma que el checkout funciona → implementar OXXO/SPEI (mayor impacto)
Si el checkout está roto → debuggear primero

**Links de sesiones reales para revisar en PostHog:**
- https://us.posthog.com/project/233989/replay/019d215c-cdfc-76c3-95bf-a1e3a5f3ecd5 (3 intentos fallidos)
- https://us.posthog.com/project/233989/replay/019d5e75-3529-7a6d-8300-5f05d79b36f5 (Facebook ad, 2 intentos)
- https://us.posthog.com/project/233989/replay/019d5cc4-5c04-7219-83f7-97f227d690fe (Facebook ad, 1 intento)