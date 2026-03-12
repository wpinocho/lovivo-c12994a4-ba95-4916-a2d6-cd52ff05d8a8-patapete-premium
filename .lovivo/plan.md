# Patapete — Plan de proyecto

## Estado actual
Pipeline AI para generación de tatuajes de mascotas funcionando.

## Pipeline (v14)
1. **BiRefNet** — background removal → transparent PNG URL
2. **Normalize** — smart crop + 800×800 white canvas → PNG base64
3. **Upload** — sube el pet normalizado a Supabase Storage → URL pública (`product-images/temp/pet-{timestamp}.png`)
4. **Claude Haiku 3** — analiza la mascota → prompt descriptivo
5. **FLUX 2 Pro** — genera el arte final via `input_images: [petUrl, styleUrl]`

## Estrategia FLUX (v14)
- **input_images[]** — FLUX 2 Pro acepta un array de URLs (no composite, no data URIs)
- **DIBUJO**: `input_images: [petUrl, STYLE_REFERENCE_DIBUJO_URL]` + prompt dual-reference ("first = pet, second = style")
- **ICONO**: `input_images: [petUrl]` + prompt haiku solo
- **Parámetros**: `aspect_ratio: '1:1'`, `resolution: '1 MP'`, `output_format: 'webp'`, `output_quality: 80`, `safety_tolerance: 2`

## Cambio clave v13 → v14
- ❌ Eliminado: compositing 1600×800 con imagescript (no soporta WebP, frágil)
- ❌ Eliminado: `image_prompt` + `image_prompt_strength` + `width/height`
- ✅ Nuevo: Upload pet normalizado a Storage en Step 2.5
- ✅ Nuevo: `input_images: [petUrl, styleUrl]` — FLUX procesa ambas referencias nativas

## URLs de referencia
- Style DIBUJO (PNG): `https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/product-images/c12994a4-ba95-4916-a2d6-cd52ff05d8a8/style-dibujo.png`
- Pets temp: `product-images/temp/pet-{timestamp}.png` (overwrite, público)

## Archivos clave
- `supabase/functions/generate-tattoo/index.ts` — pipeline principal (v14)
- `supabase/config.toml` — configuración edge functions
- `src/utils/replicateApi.ts` — cliente frontend (sin cambios)