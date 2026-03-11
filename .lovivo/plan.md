# Patapete — Plan de Generación v5 (IMPLEMENTADO ✅)

## Estado actual
Pipeline completo implementado con BiRefNet + imagescript + FLUX Dev.
Se corrigieron dos bugs críticos (Mar 2026):
1. BiRefNet endpoint 404 → `zhengpeng7/birefnet` no existe, reemplazado por `men1scus/birefnet`
2. Canvas mostraba foto cruda → `petKey` y `realUrl` ahora solo reaccionan a `generatedArtUrl`

## Arquitectura del pipeline

```
[Usuario sube foto]
      ↓
[Frontend] compressAndResizeImage() → max 1024×1024, PNG base64
      ↓
[Edge Function: generate-tattoo v5]
  1. men1scus/birefnet (version: f74986db…) via POST /v1/predictions → PNG transparente
  2. imagescript smart crop → expande bbox (20% lados, 10% top, 40% bottom)
     → centra en lienzo 800×800 blanco
  3. FLUX Dev img2img (black-forest-labs/flux-dev) → webp line art
      ↓
[Frontend] Canvas compositing:
  - isDemo: circular clip, opacity 0.45 (placeholder mientras esperamos IA)
  - isGenerated: rectangular slot + ctx.globalCompositeOperation='multiply'
    → blanco desaparece, líneas se "tatúan" sobre textura del tapete
  - RAW PHOTO: NUNCA aparece en el canvas (solo en el panel de mascota)
```

## Archivos modificados

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `src/utils/imagePreprocessing.ts` | ✅ NUEVO | compressAndResizeImage() → base64 PNG |
| `supabase/functions/generate-tattoo/index.ts` | ✅ REESCRITO v5 + FIX | BiRefNet endpoint corregido a men1scus/birefnet |
| `supabase/config.toml` | ✅ ACTUALIZADO | max_duration = 300 |
| `src/utils/replicateApi.ts` | ✅ ACTUALIZADO | Mensajes de progreso mejorados |
| `src/components/patapete/configurator/PatapeteConfigurator.tsx` | ✅ ACTUALIZADO | Usa compressAndResizeImage |
| `src/utils/canvasCompositing.ts` | ✅ REESCRITO | Slots rectangulares + multiply blend |
| `src/components/patapete/configurator/CanvasPreview.tsx` | ✅ FIX | petKey solo reacciona a generatedArtUrl, nunca a photoPreviewUrl |
| `src/utils/backgroundRemoval.ts` | ✅ VACIADO | No-op deprecated |
| `src/components/patapete/configurator/PhotoPetForm.tsx` | ✅ ACTUALIZADO | Mensajes de estado correctos |

## Secrets necesarios

| Secret | Estado |
|--------|--------|
| `REPLICATE_API_KEY` | ✅ Ya existe en Supabase |

## Parámetros clave del pipeline

### BiRefNet (CORREGIDO)
- Modelo: `men1scus/birefnet`
- Versión: `f74986db0355b58403ed20963af156525e2891ea3c2d499bfbfb2a28cd87c5d7`
- Endpoint: `POST /v1/predictions` con `{"version": "f74986db...", "input": {"image": "..."}}`
- Header: `Prefer: wait=60` para respuesta síncrona
- Output: URL string de PNG con transparencia

### Smart crop (imagescript@1.2.15)
- Padding: 20% lados, 10% top, 40% bottom del bounding box del sujeto
- Target: 800×800 blanco, sujeto al ~75% de altura

### FLUX Dev img2img
- Endpoint: `/v1/models/black-forest-labs/flux-dev/predictions`
- `prompt_strength: 0.78`
- `num_inference_steps: 28`
- `guidance: 3.5`
- `output_format: webp`, `output_quality: 92`
- Timeout: 120s polling

## Canvas compositing — Slots rectangulares

| Pets | Tamaño slot | Layout |
|------|-------------|--------|
| 1 | H×0.58 (~232px) | Centrado |
| 2 | H×0.47 (~188px) | Dos columnas con gap 27px |
| 3 | H×0.39 (~156px) | Tres columnas con gap 15px |

Canvas: 600×400px, cy = H×0.44

## Comportamiento del canvas

- Antes de subir foto → muestra imagen demo (circular, opacidad 0.45)
- Durante procesamiento IA → sigue mostrando imagen demo
- Después de IA lista → muestra el arte generado con multiply blend
- La foto cruda NUNCA aparece en el canvas

## Posibles mejoras futuras
- IP-Adapter style card para consistencia visual de marca Patapete
- Caché de resultados en Supabase Storage
- Opción de regenerar con diferentes strengths
- Soporte para múltiples breeds/razas en el prompt