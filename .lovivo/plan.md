# Patapete — Plan del proyecto

## Estado actual
Configurador de tapetes personalizados completamente funcional. Se eligió e implementó la **Opción B** del análisis de flujo de CTAs.

## Flujo de CTAs (Implementado — Opción B)

```
[⚡ ¡Ordenar ahora! — $XXX MXN →]   ← añade al carrito + navega a /pagar (comprador impulsivo)
[🛒 Agregar al carrito]              ← añade al carrito + abre CartSidebar (comprador multi-tapete)
```

- `StepSummary` eliminado como paso de navegación (step 2 removido de PatapeteConfigurator)
- Su contenido valioso (garantía + timeline "¿Qué pasa después?") movido inline a `StepPets` bajo los CTAs
- La barra sticky también actualizada: "Ver tapete" → "Agregar al carrito"

## Archivos clave del configurador
- `src/components/patapete/configurator/PatapeteConfigurator.tsx` — orquestador, maneja `handleOrderNow` y `handleAddToCart`
- `src/components/patapete/configurator/StepPets.tsx` — único paso del configurador, todos los CTAs aquí
- `src/components/patapete/configurator/StepSummary.tsx` — ya no se usa (puede eliminarse en el futuro)
- `src/components/patapete/configurator/CanvasPreview.tsx` — preview del tapete en canvas
- `src/components/patapete/configurator/PhotoPetForm.tsx` — formulario por mascota (foto + nombre)

## Lógica de apertura del carrito
`handleAddToCart` usa `useCartUISafe()` de `@/components/CartProvider` para llamar `openCart()`.

## Decisiones de UX implementadas
- Validación en el momento del clic (no botones deshabilitados) — feedback más claro
- Errores con borde rojo + scroll automático al primer campo con error
- Errores se limpian al corregir (foto o nombre)
- Textos superior/inferior opcionales
- LocalStorage persistencia del estado del configurador

## Variantes del producto (IDs reales)
```
1 mascota: '28fc993c-e638-459b-9a00-08abacdc9f32'
2 mascotas: '1aee4582-040b-477a-b335-e99446fa76c7'
3 mascotas: '5f7e007d-b30e-44c8-baa6-5aa03edb23ad'
```