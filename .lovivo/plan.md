# Patapete — Estado del proyecto

## Cambios recientes implementados

### Sticky bar 3 estados + badge en preview (✅ completado)

**Archivos modificados:** `src/components/patapete/configurator/StepPets.tsx`

#### Sticky bar — 3 estados
- Eliminado el wrapper `{!isProcessing && (` que ocultaba el sticky durante procesamiento
- Nueva condición: `(!hasAnyPhoto || isProcessing || !ctaInView)` para mostrar/ocultar
- **Estado 1 (sin foto):** "Falta la foto de tu mascota" + botón "📸 Sube tu foto"
- **Estado 2 (procesando):** Punto pulsando + "Creando la imagen de tu mascota" + "Solo tarda unos segundos" + spinner
- **Estado 3 (foto lista, CTA fuera de vista):** Estrellas + precio + "Agregar al carrito" + "Ordenar →"

#### Badge flotante en preview mobile
- Añadido `relative` al div sticky del preview mobile
- Badge `absolute bottom-3 left-1/2 -translate-x-1/2` visible solo cuando `isProcessing`
- Texto: "Generando tu retrato..." con punto pulsando de color primary
- `pointer-events-none` para no interferir con el canvas

---

### Fix sticky mobile preview (✅ completado)
Separado el bloque `lg:hidden` en dos divs:
1. `<div className="lg:hidden sticky top-16 z-10 bg-background pt-1 pb-2">` — solo el `CanvasPreview` (sticky)
2. `<div className="lg:hidden flex flex-wrap gap-2 ...">` — solo los badges (no sticky, se van con el scroll)

### Layout mobile en StepPets (✅ completado)
Nuevo orden visual en mobile:
1. ⭐ Estrellas + título
2. 🖼️ Preview del tapete (full-width, sticky)
3. 🏷️ Badges ("Hecho en México", etc.) — no sticky
4. 💰 Precio + social proof + urgencia
5. 📸 Formulario de foto y textos
6. 🛒 Botones de compra

### Upload zone full-width mobile (✅ completado)
- Upload zone full-width reemplaza el cuadrito 88px
- Sticky CTA inteligente
- Eventos PostHog: `upload_zone_viewed`, `sticky_cta_upload_tap`, `photo_uploaded`, `icon_generated`
- Scroll depth tracking (50% y 90%)

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
- Sin mencionar "IA" en textos de cara al usuario
- Mejoras orientadas a conversión