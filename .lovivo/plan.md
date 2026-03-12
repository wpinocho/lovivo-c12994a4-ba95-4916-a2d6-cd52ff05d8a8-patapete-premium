# Patapete — Plan de proyecto

## Estado actual
Pipeline AI para generación de tatuajes de mascotas funcionando.

## Bug resuelto (2026-03-12)
**Error**: `Unsupported image type` en Step 3.5 (compositing)
**Causa**: La librería `imagescript@1.2.15` no soporta WebP. La imagen de referencia de estilo era `.webp`.
**Fix**: Convertida la imagen de referencia a PNG via `image--optimize`, subida a Supabase Storage como `style-dibujo.png`. URL actualizada en la constante `STYLE_REFERENCE_DIBUJO_URL`.

Nueva URL: `https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/product-images/c12994a4-ba95-4916-a2d6-cd52ff05d8a8/style-dibujo.png`

## Pipeline (v13)
1. **BiRefNet** — background removal → transparent PNG
2. **Normalize** — smart crop + 800×800 white canvas → PNG base64
3. **Claude Haiku 3** — analiza la mascota → prompt descriptivo
4. **Step 3.5 (DIBUJO)** — composite 1600×800: pet (izq) + style reference (der)
5. **FLUX 2 Pro** — genera el arte final

## Estrategia FLUX
- **DIBUJO**: composite image_prompt (pet LEFT + style RIGHT, strength 0.3) + prompt dual-reference
- **ICONO**: foto del pet como image_prompt (strength 0.15)

## Logs implementados
- Step 3 INPUT: system prompt completo a Haiku
- Step 3 OUTPUT: prompt generado por Haiku (texto completo)
- Step 3.5: tamaño del composite
- Step 4 INPUT: fuente del image_prompt + strength + prompt completo a FLUX
- Step 4 OUTPUT: URL resultado

## Archivos clave
- `supabase/functions/generate-tattoo/index.ts` — pipeline principal
- `supabase/config.toml` — configuración edge functions