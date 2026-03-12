# Patapete — Plan de proyecto

## Estado actual
Pipeline AI para generación de tatuajes de mascotas funcionando. Ambos estilos (DIBUJO e ICONO) usan `input_images[]` con imagen de referencia de estilo.

## Pipeline (v17)
1. **BiRefNet** — background removal → transparent PNG URL
2. **Normalize** — smart crop + 800×800 white canvas → PNG base64
3. **Upload** — sube el pet normalizado a Supabase Storage (bucket `pet-tattoos` en el Supabase del usuario) → URL pública (`pet-tattoos/temp/pet-{timestamp}.png`)
4. **Claude Haiku 3** — analiza la mascota → prompt descriptivo (prompts diferenciados por estilo)
5. **FLUX 2 Pro** — genera el arte final via `input_images: [petUrl, styleUrl]` (ambos estilos)

## Bug crítico corregido (v17)
**Síntoma**: ICONO siempre producía resultado tipo DIBUJO (B&W). Los logs de la edge mostraban `style: dibujo` aunque el frontend tenía "Icono" seleccionado.

**Causa raíz**: `handleGenerate` en `PatapeteConfigurator.tsx` usaba `useCallback` con `[state.pets]` como dependency array, OMITIENDO `state.style`. Esto creaba una closure desactualizada que siempre capturaba el valor inicial `'dibujo'`.

**Fix aplicado**: Se usa `styleRef` (useRef) que siempre tiene el valor actual del estilo, y `handleGenerate` lee `styleRef.current` en lugar de `state.style`. Esto evita el stale closure sin necesidad de recrear el callback.

```typescript
// PatapeteConfigurator.tsx
const styleRef = useRef(state.style)
styleRef.current = state.style  // siempre actualizado en cada render

const handleGenerate = useCallback(async (petIndex, fileOverride) => {
  // ...
  const artUrl = await generateTattooArt(
    compressedBase64,
    pet.name || 'mascota',
    styleRef.current,  // ← siempre el estilo correcto
    ...
  )
}, [state.pets])  // sin necesidad de state.style en deps
```

## Prompts Haiku (v17) — exactos según usuario

### SYSTEM_PROMPT_DIBUJO
Instruye a Claude a extraer solo información estructural (ignora colores), y completar template de blanco y negro, estilo linocut/sello. Output en inglés.

### SYSTEM_PROMPT_ICONO
Instruye a Claude a extraer textura del pelo, colores principales, rasgos distinctivos y accesorios, y completar template de vector plano minimalista con colores sólidos (cell-shaded). Output en inglés.

## Estrategia FLUX (v17)
- **DIBUJO**: prompt = "first image = pet, second = B&W style reference" + haikuPrompt
- **ICONO**: prompt = "first image = pet, second = flat vector style reference" + haikuPrompt
- **Parámetros**: `aspect_ratio: '1:1'`, `resolution: '1 MP'`, `output_format: 'webp'`, `output_quality: 80`, `safety_tolerance: 2`

## Storage — dos Supabase
- **Supabase de Lovivo** (`ptgmltivisbtvmoxwnhd`): bucket `product-images` — aquí viven AMBAS referencias de estilo (URL fija, pública, permanente)
- **Supabase del usuario** (`vqmqdhsajdldsraxsqba`): bucket `pet-tattoos` — creado en migración `20260312204524`, aquí se suben los pets normalizados temporales

## URLs de referencia
- Style DIBUJO (PNG): `https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/product-images/c12994a4-ba95-4916-a2d6-cd52ff05d8a8/style-dibujo.png`
- Style ICONO (WebP): `https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/product-images/c12994a4-ba95-4916-a2d6-cd52ff05d8a8/style-icono.webp`
- Pets temp: `pet-tattoos/temp/pet-{timestamp}.png` (en Supabase del usuario, overwrite, público)

## Archivos clave
- `supabase/functions/generate-tattoo/index.ts` — pipeline principal (v17)
- `supabase/config.toml` — configuración edge functions
- `src/utils/replicateApi.ts` — cliente frontend (sin cambios)
- `src/components/patapete/configurator/PatapeteConfigurator.tsx` — fix stale closure v17
- `supabase/migrations/20260312204524_create_pet_tattoos_storage_bucket.sql` — bucket Storage

## Tiempos de ejecución (referencia)
- BiRefNet: ~1.5s
- Crop/normalize: ~350ms
- Upload Storage: ~700ms
- Claude Haiku: ~2.7s
- FLUX 2 Pro: ~19s
- **Total: ~24s** (todo en el modelo, frontend no añade delay)