# Patapete — Plan de mejora de conversión

## Estado actual
- Tienda activa con campaña de Meta en curso
- 0% conversión en móvil (100% del tráfico de Meta)
- Pipeline de IA: BiRefNet → Normalización → Claude Haiku → Flux 2 Pro Edit

## Cambios aplicados (2026-03-23)
**Archivo:** `supabase/functions/generate-tattoo/index.ts`
1. **Modelo Haiku:** `claude-3-haiku-20240307` → `claude-haiku-4-5`
2. **SYSTEM_PROMPT_ICONO reescrito (v3):**
   - Sin mención de raza en ningún punto
   - Template con instrucción crítica: "the line is ONE pixel-thin stroke only — NO filled black panel, NO solid block, NO thick bar, NO black area below the line"
   - Colores exactos de la imagen, no inferidos por raza
3. **Prompt a Flux:** Regla crítica de color: "If the animal is white, keep it white. If gray, keep it gray."

## Próximos pasos pendientes
- Probar con perro blanco y gato gris para verificar colores
- Monitorear logs del step 3 para verificar que Haiku 4.5 describe colores correctamente
- Monitorear que la línea inferior salga delgada (no bloque negro)

## Eventos de PostHog implementados
- `photo_uploaded`, `icon_generated`, `configurator_add_to_cart`, `configurator_order_now`
- Archivos: `PhotoPetForm.tsx` y `PatapeteConfigurator.tsx`

## Notas técnicas
- PostHog en modo `identified_only` — eventos anónimos visibles en "Events", no en "Activity"
- User's Supabase: `vqmqdhsajdldsraxsqba`
- Edge functions via `userSupabase.functions.invoke()` desde `src/integrations/supabase/client.ts`
- Meta Pixel: eventos custom (`photo_uploaded`, `icon_generated`) deben usar `trackCustom` en vez de `track`