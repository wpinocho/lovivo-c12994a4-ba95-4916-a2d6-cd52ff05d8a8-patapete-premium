# Patapete — Plan de implementación

## Estado actual
- Ecommerce de tapetes personalizados (diseño a medida por cada cliente)
- Configurador: seleccionar mascota → personalizar diseño → preview aprobado antes de comprar → checkout
- Landing page + página de producto con FAQ existente

## Decisiones de diseño
- Tipografía del tapete: **toda Plus Jakarta Sans 800** (bold, sin itálica, sin serif)
  - Phrase superior, nombres, phrase inferior — misma fuente
  - Aplica tanto en CanvasPreview.tsx (preview visual) como en canvasCompositing.ts (JPG final)
- Flujo: Botón "⚡ Ordenar ahora" + "🛒 Agregar al carrito"
- StepSummary eliminado como paso navegable — contenido inline en el configurador

## Garantía (definida)
- Cubre: defectos físicos de fabricación/material
- NO cubre: cambios de diseño (cliente ya vio y aprobó el preview)
- Timeline real: producción 3-5 días hábiles, entrega 7-10 días totales

## FAQs
- Ambos archivos (landing + página de producto) actualizados y consistentes
- Pregunta clave: "¿El preview es el diseño real?" — diferenciador principal

## Archivos clave
- src/components/patapete/configurator/CanvasPreview.tsx — preview visual en configurador
- src/utils/canvasCompositing.ts — generación del JPG final para el pedido
- src/components/patapete/configurator/StepSummary.tsx — resumen antes de pagar
- src/components/patapete/ProductFAQ.tsx — FAQ página de producto
- src/components/patapete/PatapeteFAQ.tsx — FAQ landing page