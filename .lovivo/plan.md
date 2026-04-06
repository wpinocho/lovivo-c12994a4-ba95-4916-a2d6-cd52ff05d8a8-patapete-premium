# Patapete Store - Plan

## Current State
Tienda de tapetes personalizados con fotos de mascotas. Pipeline de IA funcionando (Supabase edge functions, ~23-26s por generación).

## Recent Changes
- **Checkout mobile fixes v2** (2026-04-06):
  - **Stripe CardElement → campos separados**: `CardNumberElement` (fila completa) + `CardExpiryElement` + `CardCvcElement` lado a lado (grid-cols-2). Elimina el texto encimado en mobile.
  - **Header "Tarjeta de crédito"**: `whitespace-nowrap` en texto + `shrink-0` en imagen. Ya no se parte en 3 líneas.
  - **Imagen producto en checkout**: `w-16 h-16 object-contain bg-muted/40` — tamaño fijo, sin recorte, tapete retrato se ve completo.
  - **Nombre producto**: `line-clamp-2 text-sm leading-snug` — máximo 2 líneas con `...`
  - **Precio**: `shrink-0 text-sm` — no se comprime en flex
  - **Container flex-1**: añadido `min-w-0` — necesario para que truncate/line-clamp funcione en flex
- **Checkout mobile fixes v1** (2026-04-06):
  - Botón "Completar Compra": texto en 2 líneas (título + precio separado), sin decimales .00, h-auto para no cortar
  - Imagen producto en resumen: 64px → 80px (`w-20 h-20`)
  - Badge cantidad: colores de marca (`bg-primary text-primary-foreground`)
- Sticky bar de 3 estados (sin foto → procesando → listo)
- Badge animado "Generando tu retrato..." sobre preview mobile durante procesamiento

## User Preferences
- No mencionar "IA" en copy al usuario
- Mantener perro demo visible durante generación
- Idioma: español

## Known Issues
- Ninguno activo conocido