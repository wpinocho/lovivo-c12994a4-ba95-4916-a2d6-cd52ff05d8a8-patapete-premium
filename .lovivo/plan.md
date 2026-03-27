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

---

## PRÓXIMO: Sticky bar 3 estados + badge en preview

### Problema identificado
El sticky bar se oculta completamente cuando `isProcessing = true` (línea `{!isProcessing && (`).
Esto causa que:
1. El usuario sube la foto → sticky desaparece → no hay feedback
2. El preview sigue mostrando el perro demo → el usuario no sabe si su foto fue recibida

### Plan de implementación

#### 1. Sticky bar — 3 estados (archivo: StepPets.tsx)

**Eliminar** el wrapper `{!isProcessing && (` que oculta el sticky durante el procesamiento.

**Agregar estado "procesando"** al sticky bar:

```
Estado 1 — Sin foto (!hasAnyPhoto && !isProcessing):
  Left:  "Falta la foto de tu mascota"
  Right: Botón "📸 Sube tu foto" (abre picker)

Estado 2 — Procesando (isProcessing === true):
  Left:  Spinner/pulse + "✨ Creando tu retrato..."
  Right: Texto pequeño "Solo tarda unos segundos"
  Sin botón — no hay acción posible ahora

Estado 3 — Listo, CTA fuera de vista (hasAnyPhoto && !isProcessing && !ctaInView):
  Left:  Stars + "Tapete personalizado"
  Right: Precio + "Agregar al carrito" + "Ordenar →"
```

**Lógica del sticky:**
```tsx
// Remove: {!isProcessing && (
// New condition to show/hide:
const showSticky = !hasAnyPhoto || isProcessing || !ctaInView
// className: showSticky ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
```

El sticky se muestra:
- Sin foto (siempre visible — invita a subir)
- Procesando (siempre visible — feedback de progreso)
- Con foto lista y CTA fuera de vista

#### 2. Badge flotante en preview durante procesamiento (archivo: StepPets.tsx)

En el div mobile sticky del preview, envolver con posición relativa y añadir badge condicional:

```tsx
<div className="lg:hidden sticky top-16 z-10 bg-background pt-1 pb-2 relative">
  <CanvasPreview ... />
  {isProcessing && (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-sm border border-border shadow-md text-xs font-medium text-foreground">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
        ✨ Generando tu retrato...
      </span>
    </div>
  )}
</div>
```

Esto no toca CanvasPreview — el demo dog sigue visible (muestra cómo quedará el producto), y el badge le dice al usuario "tu mascota va a aparecer aquí".

### Archivos a modificar
- `src/components/patapete/configurator/StepPets.tsx`: sticky 3 estados + badge en preview

### NO modificar
- `src/components/patapete/configurator/CanvasPreview.tsx`: sin cambios
- `src/components/patapete/configurator/PhotoPetForm.tsx`: sin cambios

---

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