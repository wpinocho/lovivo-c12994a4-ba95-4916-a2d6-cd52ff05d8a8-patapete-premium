# Patapete — Estado del proyecto

## Cambios recientes implementados

### Fix sticky mobile preview (✅ completado)
Separado el bloque `lg:hidden` en dos divs:
1. `<div className="lg:hidden sticky top-16 z-10 bg-background pt-1 pb-2">` — solo el `CanvasPreview` (sticky)
2. `<div className="lg:hidden flex flex-wrap gap-2 ...">` — solo los badges (no sticky, se van con el scroll)

También eliminado el texto descriptivo redundante en PART B:
- ❌ "Sube la foto de tu mascota y ve cómo queda en tu tapete antes de pedirlo."
- Razón: ya lo dicen el upload zone y el sticky bar de abajo — era ruido visual

### Layout mobile en StepPets (✅ completado)
Nuevo orden visual en mobile:
1. ⭐ Estrellas + título (contexto rápido)
2. 🖼️ Preview del tapete (full-width, sticky — el gancho visual)
3. 🏷️ Badges ("Hecho en México", etc.) — no sticky, se van con scroll
4. 💰 Precio + social proof + urgencia
5. 📸 Formulario de foto y textos
6. 🛒 Botones de compra

Desktop: sin cambios — 2 columnas con preview sticky a la izquierda.

**Decisiones técnicas:**
- `onPreviewReady` solo se pasa al `CanvasPreview` mobile (sticky div)
- El preview mobile usa `sticky top-16 z-10 bg-background` — se queda arriba al hacer scroll
- Los badges van en div separado (no sticky)
- El texto descriptivo fue eliminado

### Upload zone full-width mobile (✅ completado antes)
- Upload zone full-width reemplaza el cuadrito 88px
- Sticky CTA inteligente: sin foto = "Sube tu foto"; con foto = "Ordenar"
- Evento `upload_zone_viewed` en PostHog
- Scroll depth tracking (50% y 90%)

## Métricas de referencia (baseline)
- ~285 visitas reales Meta en últimos 30 días
- 4% (14 usuarios) suben foto → cuello de botella crítico
- 93% de quienes suben foto generan ícono
- 7 intentan ordenar → 1 compra
- Tráfico interno (lovivo.app): 631 visitas, 53 checkouts falsos

## Preferencias del usuario
- Mobile-first (mayoría de tráfico de Meta)
- UX pragmático, sin cambios radicales
- Mejoras orientadas a conversión