# Patapete — Plan de proyecto

## Estado actual
UI rediseñada con flujo unificado. La funcionalidad de generación IA está conectada.

## Cambios recientes
### UI Unificada (flujo único)
- **types.ts**: `Style = 'tattoo'` (eliminado vector). `PRICES` solo para tattoo.
- **PatapeteConfigurator.tsx**: Eliminado vector logic. `handleGenerate(petIndex, fileOverride?)` acepta file override para auto-generar tras upload.
- **PhotoPetForm.tsx**: Auto-genera al subir foto (`onGenerate(file)` en handleFileChange/handleDrop). Sin botón "Generar". Botón "Reintentar" cuando falla.
- **StepPets.tsx**: Sin selector de estilo. Botón continuar muestra precio `$649 MXN →`. Badge "Retrato IA · Arte único".
- **StepSummary.tsx**: Sin campo "Estilo". Muestra "Retrato IA". VARIANT_IDS solo tattoo.
- **PatapeteHero.tsx**: Subheadline "Sube su foto. La IA crea su retrato artístico. Ve cómo queda antes de comprarlo." 2do CTA → "¿Cómo funciona?" → `#como-funciona`.
- **PatapeteStyles.tsx**: Sección convertida a showcase de features del arte IA (4 cards: recorte, tatuaje fino, resultado rápido, arte exclusivo).
- **PatapeteHowItWorks.tsx**: Paso 02 → "La IA crea el retrato".
- **EcommerceTemplate.tsx**: Nav "Estilos" → "El arte IA".

## Arquitectura técnica
- Edge function `generate-tattoo` en Supabase del usuario (`vqmqdhsajdldsraxsqba`)
- Frontend usa `userSupabase.functions.invoke()` desde `src/integrations/supabase/client.ts`
- `replicateApi.ts` → llama a `userSupabase.functions.invoke('generate-tattoo')`
- Flujo: upload foto → removeBackground → generateTattooArt (IA via Replicate) → muestra retrato en preview

## Próximos pasos
- Mejorar calidad del crop (cabeza/hombros) en el modelo de IA
- Probar el flujo end-to-end con fotos reales de mascotas
- Afinar el prompt del modelo para mejor resultado visual