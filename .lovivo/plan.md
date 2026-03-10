# Patapete - Plan

## Estado actual
- Tienda de tapetes personalizados con mascotas
- Configurador visual con generación de tatuajes IA (Replicate)
- Canvas compositing con preview en tiempo real
- 3 imágenes demo en `public/demo/`

## Problemas resueltos
- Loop infinito de loading: `petKey` derivada de contenido, `onPreviewReady` en ref
- Imágenes demo faltantes: generadas y colocadas
- Edge Function requería redeploy forzado (v4)
- **CORS / JWT verification**: `verify_jwt = false` en `supabase/config.toml`
- **Cliente Supabase incorrecto**: `replicateApi.ts` usaba `callEdge()` → Lovivo's Supabase (`ptgmltivisbtvmoxwnhd`). Corregido a `userSupabase.functions.invoke()` → Supabase del usuario (`vqmqdhsajdldsraxsqba`)

## Arquitectura
- Edge Function: `supabase/functions/generate-tattoo/index.ts` (proxy a Replicate)
- Cliente: `src/utils/replicateApi.ts` → `userSupabase.functions.invoke()` → `src/integrations/supabase/client.ts`
- Secret: `REPLICATE_API_KEY` en Supabase del usuario
- `supabase/config.toml` → `[functions.generate-tattoo] verify_jwt = false`

## Regla importante
La función `generate-tattoo` vive en el Supabase del USUARIO (`vqmqdhsajdldsraxsqba`).
NUNCA usar `callEdge()` de `src/lib/edge.ts` para esta función — ese usa el Supabase de Lovivo.
SIEMPRE usar `userSupabase` de `src/integrations/supabase/client.ts`.