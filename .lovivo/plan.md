# Patapete — Plan de proyecto

## Estado actual
Pipeline AI para generación de tatuajes de mascotas funcionando. Ambos estilos (DIBUJO e ICONO) usan `input_images[]` con imagen de referencia de estilo.

## Pipeline (v15)
1. **BiRefNet** — background removal → transparent PNG URL
2. **Normalize** — smart crop + 800×800 white canvas → PNG base64
3. **Upload** — sube el pet normalizado a Supabase Storage (bucket `pet-tattoos` en el Supabase del usuario) → URL pública (`pet-tattoos/temp/pet-{timestamp}.png`)
4. **Claude Haiku 3** — analiza la mascota → prompt descriptivo (prompts diferenciados por estilo)
5. **FLUX 2 Pro** — genera el arte final via `input_images: [petUrl, styleUrl]` (ambos estilos)

## Estrategia FLUX (v15)
- **input_images[]** — FLUX 2 Pro acepta un array de URLs (no composite, no data URIs)
- **DIBUJO**: `input_images: [petUrl, STYLE_REFERENCE_DIBUJO_URL]` + prompt dual-reference ("first = pet, second = style")
- **ICONO**: `input_images: [petUrl, STYLE_REFERENCE_ICONO_URL]` + prompt dual-reference igual que DIBUJO
- **Parámetros**: `aspect_ratio: '1:1'`, `resolution: '1 MP'`, `output_format: 'webp'`, `output_quality: 80`, `safety_tolerance: 2`

## Storage — dos Supabase
- **Supabase de Lovivo** (`ptgmltivisbtvmoxwnhd`): bucket `product-images` — aquí vive `style-dibujo.png` (URL fija, pública)
- **Supabase del usuario** (`vqmqdhsajdldsraxsqba`): bucket `pet-tattoos` — creado en migración `20260312204524`, aquí se suben los pets normalizados temporales

## URLs de referencia
- Style DIBUJO (PNG): `https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/product-images/c12994a4-ba95-4916-a2d6-cd52ff05d8a8/style-dibujo.png`
- Style ICONO (WebP): `https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773350235538-8uqgrzk0xup.webp`
- Pets temp: `pet-tattoos/temp/pet-{timestamp}.png` (en Supabase del usuario, overwrite, público)

## Archivos clave
- `supabase/functions/generate-tattoo/index.ts` — pipeline principal (v15)
- `supabase/config.toml` — configuración edge functions
- `src/utils/replicateApi.ts` — cliente frontend (sin cambios)
- `supabase/migrations/20260312204524_create_pet_tattoos_storage_bucket.sql` — bucket Storage

## Tiempos de ejecución (referencia)
- BiRefNet: ~1.5s
- Crop/normalize: ~350ms
- Upload Storage: ~700ms
- Claude Haiku: ~2.7s
- FLUX 2 Pro: ~19s
- **Total: ~24s** (todo en el modelo, frontend no añade delay)