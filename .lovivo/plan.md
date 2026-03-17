# Patapete — Plan del Proyecto

## Estado Actual
Tienda de tapetes personalizados con IA para mascotas (Patapete). Producto único: tapete 60×40cm con retrato artístico de mascota generado por IA.

## Material del Producto (ACTUALIZADO)
- **Material real:** Sublimable Synthetic Coir Doormat (fibra sintética tipo coco con impresión por sublimación)
- **Comunicación al cliente:** "Fibra sintética premium", "Sublimación HD", "colores fusionados en la fibra — no pintados por encima"
- **Ventajas clave a destacar:** No se pela, no se agrieta, resiste agua/lodo, mayor detalle de imagen que fibra natural
- **Cuidado del sol:** Se comunica SOLO como FAQ ("¿Dónde lo coloco para que dure más tiempo?") — en PatapeteFAQ.tsx y ProductFAQ.tsx. Ya NO aparece como bloque visual en PatapeteMaterials.tsx.

## Cambios de Material Realizados (todos los archivos actualizados)
- PatapeteMaterials.tsx — sección principal reescrita con nueva narrativa + nota de sol ELIMINADA
- ProductFAQ.tsx — FAQ de sol agregada + respuestas de material actualizadas
- PatapeteFAQ.tsx — FAQ de sol agregada + mención a "fibra de coco natural" removida
- PatapetePersonalization.tsx — "sublimación HD" en lugar de "sobre fibra de coco natural"
- PatapeteStyles.tsx — "sublimación HD" en la descripción del feature
- PatapeteTestimonials.tsx — "calidad del material" (neutral)
- PatapeteTransformation.tsx — "imprimimos por sublimación"
- StepSummary.tsx — spec cambiada a "Sublimación HD" con icono Sparkles
- EcommerceTemplate.tsx — footer actualizado
- PatapeteConfigurator.tsx — metadata interna actualizada

## Preferencias del Usuario
- Color verde brillante (green-*/emerald-*) reemplazado por `accent` (verde oliva)
- Badge "Retrato listo" eliminado del configurador
- Precio fijo: $949 MXN (constante PRICES en types.ts)

## Estructura Técnica
- **Edge Function:** `upload-patapete-preview` — recibe customization_data + genera preview_image_url
- **Flujo:** agregar al carrito → persiste preview en localStorage → checkout lee de BD + localStorage como fallback
- **Logo checkout:** componente BrandLogoLeft (logo Patapete con patita)
- **Material interno:** `'fibra sintetica sublimacion'` en customization_data

## Archivos Clave
- `src/components/patapete/` — todos los componentes de la homepage
- `src/components/patapete/configurator/` — flujo de personalización
- `src/pages/ui/ProductPageUI.tsx` — página de producto
- `src/pages/ui/CheckoutUI.tsx` — checkout
- `src/templates/EcommerceTemplate.tsx` — layout + footer