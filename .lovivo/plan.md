# Plan: CRO — Página de Producto Patapete

## Objetivo
Aumentar el conversion rate de la página de producto del tapete personalizado.
La página de producto es el `PatapeteConfigurator` (StepPets + StepSummary), no la genérica de Lovivo.

## Estado actual
- `StepPets`: configurador principal (estilo, mascotas, fotos, frases)
- `StepSummary`: resumen + botón agregar al carrito
- Hay trust badges básicos (4 íconos emoji)
- No hay urgencia, no hay FAQ, no hay social proof IN-PAGE, no hay garantía prominente
- No hay info de producto (tamaño, material, cuidado)

## Hallazgos de investigación CRO
Basado en estudios 2024-2026:
- **Social proof en contexto** = +3-4x conversión (reviews IN-PAGE, no solo en landing)
- **Sticky CTA / urgencia** = +8-15% lift
- **FAQ inline** = reduce objeciones sin salir de la página
- **Garantía prominente** = reduce miedo al comprar algo custom
- **Especificaciones claras** (tamaño, material) = quita la duda más grande en tapetes
- **Progress bar** en configurador = reduce abandono mid-flow

## Cambios a implementar

### 1. Nuevo componente: `PatapeteProductFAQ.tsx`
Acordeón con las 6 preguntas más comunes:
- ¿A qué tamaño llega el tapete?
- ¿De qué material está hecho?
- ¿Cuánto tarda en llegar?
- ¿Qué pasa si no me gusta el diseño?
- ¿Qué tipo de foto necesito subir?
- ¿Puedo poner texto en el tapete?

### 2. Nuevo componente: `PatapeteSocialProofBar.tsx`
Barra discreta con:
- Conteo: "🐾 +500 tapetes entregados"
- Rating: "⭐ 4.9/5 de satisfacción"
- Social: "👀 12 personas configurando ahora"
- 2 mini-reviews en horizontal (excerpt corto + nombre)

### 3. Mejorar `StepSummary.tsx`
- Garantía prominente con tarjeta verde: "Si el diseño no te gusta, lo rehacemos sin costo. Sin preguntas."
- Urgencia sutil: "Producción artesanal · Entrega en 5-7 días hábiles"
- Especificaciones del producto: sección con icono + texto: Tamaño 60x40cm, Fibra de coco natural, Lavable con agua fría
- Mejorar el botón CTA: agregar micro-texto debajo "✓ Personalización guardada · Pago 100% seguro"
- Después de "agregado": botón prominente "Ir al carrito →" en verde

### 4. Mejorar `StepPets.tsx`
- Progress steps visualization: "Paso 1 de 2 · Configura tu tapete" con indicador visual simple
- Mini social proof inline: pequeño texto debajo del título: "Únete a +500 dueños que ya tienen el suyo"

### 5. Integrar todo en `PatapeteConfigurator.tsx`
- Mostrar `PatapeteSocialProofBar` encima del configurador (step 1 only)
- Mostrar `PatapeteProductFAQ` debajo del configurador (siempre)

## Archivos a modificar
- `src/components/patapete/configurator/StepSummary.tsx`: garantía prominente, urgencia, specs, mejor post-add CTA
- `src/components/patapete/configurator/StepPets.tsx`: progress indicator, mini social proof texto
- `src/components/patapete/configurator/PatapeteConfigurator.tsx`: integrar nuevos componentes

## Archivos a crear
- `src/components/patapete/PatapeteProductFAQ.tsx`: acordeón FAQ
- `src/components/patapete/PatapeteSocialProofBar.tsx`: barra social proof

## Notas técnicas
- El FAQ usa Radix Accordion (ya disponible en el proyecto)
- No usar imágenes hardcodeadas — el usuario las proveerá después
- Mantener el estilo visual existente (rounded-2xl, colores primary, card-premium)
- La garantía usa el color green-50/green-200 ya usado en el success state del StepSummary
- "12 personas viendo" puede ser un número estático (no requiere backend)