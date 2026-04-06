# Patapete Store - Plan

## Current State
Tienda de tapetes personalizados con fotos de mascotas. Pipeline de IA funcionando (Supabase edge functions, ~23-26s por generación).

## Recent Changes
- **Checkout mobile fixes** (2026-04-06):
  - Botón "Completar Compra": texto en 2 líneas (título + precio separado), sin decimales .00, h-auto para no cortar
  - Imagen producto en resumen: 64px → 80px (`w-20 h-20`)
  - Container item: `items-center space-x-4` → `items-start gap-3`
  - Badge cantidad: colores de marca (`bg-primary text-primary-foreground`)
- Sticky bar de 3 estados (sin foto → procesando → listo)
- Badge animado "Generando tu retrato..." sobre preview mobile durante procesamiento

## User Preferences
- No mencionar "IA" en copy al usuario
- Mantener perro demo visible durante generación
- Idioma: español

## Known Issues
- Checkout mobile layout mejorado pero puede seguir revisándose en desktop