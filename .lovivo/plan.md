# Patapete — Estado del proyecto

## Cambios recientes implementados

### Layout mobile en StepPets (✅ completado)
Nuevo orden visual en mobile:
1. ⭐ Estrellas + título (contexto rápido)
2. 🖼️ Preview del tapete (full-width, estático — el gancho visual)
3. 💰 Descripción + precio + social proof + urgencia
4. 📸 Formulario de foto y textos
5. 🛒 Botones de compra

Desktop: sin cambios — 2 columnas con preview sticky a la izquierda.

**Decisiones técnicas:**
- `onPreviewReady` solo se pasa al `CanvasPreview` mobile (el que renderiza primero en mobile)
- El preview mobile ya NO es sticky — es estático y full-width
- Se eliminó el subtexto "Es el primer paso para crear tu tapete" del sticky bar

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