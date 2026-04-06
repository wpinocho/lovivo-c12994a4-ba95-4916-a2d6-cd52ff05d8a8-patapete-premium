# Patapete Store — Plan

## Current State
Tienda Patapete funcionando con configurador de tapetes personalizados. Checkout integrado con Stripe.

## Recent Changes
- Ajustado grid CP/Ciudad/Estado: columna completa mobile, 3 cols desktop
- Moneda MXN inline a la izquierda del precio (estilo Shopify)
- Resumen de orden colapsable en mobile (accordion arriba del form)
- **Fix botón Link de Stripe en mobile**: reducido padding de checkout form wrapper (`p-3 sm:p-6`) y CardContent de Stripe (`p-3 sm:p-6`) para que el campo de número de tarjeta tenga ≥300px de ancho y Stripe muestre el botón de Link

## Known Issues
- Ninguno activo

## User Preferences
- Seguir patrones de diseño Shopify para el checkout
- Mobile-first UX
- Resumen colapsable en mobile, columna fija en desktop