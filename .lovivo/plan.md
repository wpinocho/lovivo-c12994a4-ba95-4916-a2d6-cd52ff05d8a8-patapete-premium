# Plan: Reordenamiento de layout mobile en StepPets

## Qué quiere el usuario
Reorganizar el orden visual en mobile de la página de producto para que el preview aparezca más arriba. La estructura deseada es:
1. Estrellas + título (contexto mínimo)
2. Preview del tapete (el gancho visual)
3. Precio + prueba social + urgencia
4. Formulario (cantidad de mascotas, upload de foto, textos)
5. Botones CTA

También: eliminar el subtexto "Es el primer paso para crear tu tapete" del sticky bar inferior (no se ve y no aporta).

## Estado actual (StepPets.tsx)
El bloque `<div className="pb-1">` contiene TODO el header (estrellas, título, descripción, precio, social proof, urgencia) ANTES del grid.

Dentro del grid, el mobile preview es el primer elemento del right column con `className="lg:hidden sticky top-16 z-10 ..."`.

En mobile el orden actual es:
1. [Estrellas + título + descripción + precio + social proof + urgencia]
2. [Preview — sticky]
3. [Formulario]

## Implementación

### En StepPets.tsx

**PASO 1: Dividir el header**

El bloque del header actual (línea ~162 a ~209) debe dividirse en dos partes:

**Parte A — "above preview" (siempre visible, mobile y desktop):**
- Estrellas + rating
- Título h1

**Parte B — "below preview en mobile, after title en desktop" (solo visible después del preview en mobile):**
- Descripción (el `<p>` con "Sube la foto de tu mascota...")
- Precio
- Social proof (viewers + delivery)
- Urgencia (badge ámbar)

En desktop, la Parte B puede ir dentro del right column (antes del pet count selector), ya que el layout es 2 columnas y el preview está en la izquierda sticky.

En mobile, la Parte B debe aparecer DESPUÉS del preview.

**PASO 2: Mover el preview en mobile**

El preview en mobile (actualmente dentro del right column con `lg:hidden`) debe salir del grid y colocarse DESPUÉS de la Parte A del header (estrellas + título) pero ANTES de la Parte B (precio, etc.).

Quitar el `sticky top-16 z-10` del preview mobile — ya no necesita ser sticky porque estará arriba de forma natural. Hacerlo estático, full-width.

**PASO 3: Reestructurar el grid**

El grid `lg:grid lg:grid-cols-2` solo aplica en desktop. En mobile es columna única.

- Left col (desktop only): Preview sticky — sin cambios
- Right col: 
  - Parte B del header (descripción, precio, social proof, urgencia) — solo visible en mobile aquí, en desktop también
  - Pet count selector
  - Formulario de mascotas
  - Campos de frases
  - CTAs

**Nueva estructura del JSX:**

```
<div className="space-y-4">

  {/* PARTE A: Siempre arriba — estrellas + título */}
  <div>
    [estrellas]
    [h1 título]
  </div>

  {/* PREVIEW MOBILE — solo mobile, estático, full-width, después del título */}
  <div className="lg:hidden">
    <CanvasPreview ... />
    [badges: Hecho en México, Envío, Garantía]  ← opcional, queda bien aquí
  </div>

  {/* MAIN GRID */}
  <div className="lg:grid lg:grid-cols-2 lg:gap-10 lg:items-start">

    {/* LEFT — solo desktop, sticky */}
    <div className="hidden lg:block sticky top-20">
      <CanvasPreview ... />
      [badges]
    </div>

    {/* RIGHT — mobile full width, desktop right col */}
    <div className="space-y-6">

      {/* PARTE B: descripción + precio + social proof + urgencia */}
      <div>
        [descripción]
        [precio]
        [viewers + delivery]
        [badge urgencia]
      </div>

      {/* Pet count selector */}
      {/* Photo forms */}
      {/* Phrases */}
      {/* CTA section */}

    </div>
  </div>

  {/* Sticky bar */}
  ...
</div>
```

**PASO 4: Sticky bar — eliminar subtexto**

En el sticky bar (alrededor de línea 431), cuando `!hasAnyPhoto`:
```jsx
<div className="min-w-0">
  <p className="font-semibold text-sm text-foreground leading-tight">Falta la foto de tu mascota</p>
  {/* ELIMINAR esta línea: */}
  <p className="text-xs text-muted-foreground">Es el primer paso para crear tu tapete</p>
</div>
```
Simplemente quitar ese `<p>` de subtexto.

## Archivos a modificar
- `src/components/patapete/configurator/StepPets.tsx`: Reordenamiento del layout y eliminación del subtexto en sticky bar

## Notas
- En desktop NO cambia nada — el 2-col layout con preview sticky a la izquierda se mantiene igual
- El preview mobile pasa de ser "sticky inside grid" a ser "static before grid"
- Mantener todos los eventos de tracking actuales sin cambios
- El `onPreviewReady` callback solo debe pasarse a UNO de los dos CanvasPreview (el de desktop o el de mobile, no ambos) para evitar duplicar el callback. Pasarlo al de mobile y quitar `onPreviewReady` del de desktop, o viceversa — verificar cuál es el correcto.