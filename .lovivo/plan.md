# Patapete — Estado del proyecto

## Cambios recientes implementados

### Layout mobile en StepPets (✅ completado)
Nuevo orden visual en mobile:
1. ⭐ Estrellas + título (contexto rápido)
2. 🖼️ Preview del tapete (full-width, sticky — el gancho visual)
3. 💰 Precio + social proof + urgencia
4. 📸 Formulario de foto y textos
5. 🛒 Botones de compra

Desktop: sin cambios — 2 columnas con preview sticky a la izquierda.

**Decisiones técnicas:**
- `onPreviewReady` solo se pasa al `CanvasPreview` mobile
- El preview mobile es `sticky top-16 z-10 bg-background` — se queda arriba al hacer scroll PERO el título/estrellas NO son sticky (se van con el scroll)
- Los badges ("Hecho en México", etc.) van FUERA del div sticky, en su propio div no-sticky debajo
- Se eliminó el texto descriptivo "Sube la foto de tu mascota y ve cómo queda en tu tapete antes de pedirlo." — es redundante con el upload zone y el sticky bar

### Fix pendiente: sticky mobile preview (🔧 por implementar)
**Problema:** Al reordenar el layout mobile, el `div.lg:hidden` del preview quedó sin clase `sticky`.

**Solución en `src/components/patapete/configurator/StepPets.tsx`:**

Separar el bloque `lg:hidden` en DOS divs:
1. `<div className="lg:hidden sticky top-16 z-10 bg-background pt-1 pb-2">` — solo contiene el `CanvasPreview`
2. `<div className="lg:hidden flex flex-wrap gap-2 ...">` — solo contiene los badges (no sticky)

También eliminar el párrafo de descripción en la sección PART B:
```tsx
// ELIMINAR esta línea:
<p className="text-muted-foreground text-sm leading-relaxed max-w-md">
  Sube la foto de tu mascota y ve cómo queda en tu tapete antes de pedirlo.
</p>
```

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