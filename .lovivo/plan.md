# Patapete - Plan

## Estado actual
- Tienda de tapetes personalizados con mascotas
- Configurador visual con generación de tatuajes IA (Replicate)
- Canvas compositing con preview en tiempo real
- 3 imágenes demo en `public/demo/`

## Problemas resueltos
- Loop infinito de loading: `petKey` derivada de contenido, `onPreviewReady` en ref
- Imágenes demo faltantes: generadas y colocadas
- Edge Function requería redeploy forzado

## Error resuelto: CORS / JWT verification
**Causa**: Supabase Edge Functions tienen JWT verification activado por defecto.
El preflight OPTIONS es bloqueado con 401 ANTES de que el código maneje CORS.

**Solución aplicada**:
1. `supabase/config.toml` → añadido `[functions.generate-tattoo] verify_jwt = false`
2. Bump a `v4` en el index.ts para forzar redeploy

## Arquitectura
- Edge Function: `supabase/functions/generate-tattoo/index.ts` (proxy a Replicate)
- Cliente: `src/utils/replicateApi.ts` → `callEdge()` → `src/lib/edge.ts`
- Secret: `REPLICATE_API_KEY` en Supabase secrets