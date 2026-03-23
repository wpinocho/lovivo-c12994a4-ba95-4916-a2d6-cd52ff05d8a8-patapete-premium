# Patapete — Plan de mejora de conversión

## Estado actual
- Tienda activa con campaña de Meta en curso
- 0% conversión en móvil (100% del tráfico de Meta)
- Pipeline de IA: BiRefNet → Normalización → Claude Haiku → Flux 2 Pro Edit

## Problema detectado (2026-03-23)
**Claude Haiku 3 infería colores por raza, no por la imagen real.**
- Perro blanco → lo clasificaba como "Golden Retriever" → Flux lo pintaba dorado
- Gato gris → lo clasificaba como "Siamese" → Flux lo pintaba beige/crema
- En un run llegó a identificar una mascota como "baby boy"

## Cambios aplicados (2026-03-23)
**Archivo:** `supabase/functions/generate-tattoo/index.ts`
1. **Modelo Haiku:** `claude-3-haiku-20240307` → `claude-haiku-4-5`
2. **SYSTEM_PROMPT_ICONO reescrito:** 
   - Eliminado todo rastro de "raza" del análisis
   - Reemplazado por instrucción explícita de colores exactos de la imagen
   - Template nuevo más claro y minimalista (cell-shaded style)
3. **Prompt a Flux:** Agregada regla crítica "CRITICAL COLOR RULE: Use ONLY the EXACT colors visible in image 1. DO NOT apply breed-typical or assumed coloring."

## Próximos pasos pendientes
- Probar con las imágenes del perro blanco y el gato gris
- Monitorear logs del step 3 para verificar que Haiku 4.5 describe colores correctamente
- Si sigue habiendo problemas de color: considerar eliminar Haiku completamente y pasar solo el prompt genérico + imagen directa a Flux

## Eventos de PostHog implementados
- `photo_uploaded`, `icon_generated`, `configurator_add_to_cart`, `configurator_order_now`
- Archivos: `PhotoPetForm.tsx` y `PatapeteConfigurator.tsx`

## Notas técnicas
- PostHog en modo `identified_only` — eventos anónimos visibles en "Events", no en "Activity"
- User's Supabase: `vqmqdhsajdldsraxsqba`
- Edge functions via `userSupabase.functions.invoke()` desde `src/integrations/supabase/client.ts`