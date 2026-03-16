# Patapete — Plan

## Current State
Configurador de tapetes personalizados con fotos de mascotas. Stack: React/TS, Supabase, Stripe.

## Recent Changes
- Garantía actualizada en todos los archivos: de "rehacemos el diseño" → "reponemos si hay defecto de fabricación"
- Flujo "¿Qué pasa después de ordenar?" corregido a tiempos reales:
  1. Orden confirmada → empezamos producción
  2. Fabricamos tu tapete — 3-5 días hábiles
  3. Lo enviamos — con número de rastreo por correo
  4. Llega a tu puerta — 7-10 días desde la compra
- Iconos del proceso ahora usan Lucide (CheckCircle, Scissors, Truck, Home) con `text-primary` (terracotta) en vez de emojis
- FAQs (PatapeteFAQ.tsx + ProductFAQ.tsx) actualizados para ser coherentes con el modelo real: preview antes de comprar = diseño ya aprobado
- ProductFAQ: pregunta "¿Puedo ver el diseño antes?" → "¿El preview que veo es el diseño real del tapete?"

## User Preferences
- Lenguaje es-MX
- Preview antes de comprar = diferenciador clave → comunicarlo explícitamente
- Garantía cubre solo defectos físicos, NO cambio de opinión sobre diseño
- Tiempos: producción 3-5 días hábiles, total 7-10 días hábiles

## CTA Flow
- "⚡ ¡Ordenar ahora!" → directo a checkout
- "🛒 Agregar al carrito" → abre sidebar
- Sticky CTA bar cuando los botones salen de pantalla