# Patapete — Plan de Generación v5 (IMPLEMENTADO ✅)

## Estado actual
Pipeline completo implementado con BiRefNet + imagescript + FLUX Dev.

## Arquitectura del pipeline

```
[Usuario sube foto]
      ↓
[Frontend] compressAndResizeImage() → max 1024×1024, PNG base64
      ↓
[Edge Function: generate-tattoo v5]
  1. BiRefNet (zhengpeng7/birefnet en Replicate) → PNG transparente
  2. imagescript smart crop → expande bbox (20% lados, 10% top, 40% bottom)
     → centra en lienzo 800×800 blanco
  3. FLUX Dev img2img (black-forest-labs/flux-dev) → webp line art
      ↓
[Frontend] Canvas compositing:
  - isDemo: circular clip, opacity 0.45 (placeholder)
  - isGenerated: rectangular slot + ctx.globalCompositeOperation='multiply'
    → blanco desaparece, líneas se "tatúan" sobre textura del tapete
  - raw photo (en procesamiento): rectangular slot, source-over, opacity 0.72
```

## Archivos modificados

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `src/utils/imagePreprocessing.ts` | ✅ NUEVO | compressAndResizeImage() → base64 PNG |
| `supabase/functions/generate-tattoo/index.ts` | ✅ REESCRITO v5 | Pipeline BiRefNet + imagescript + FLUX Dev |
| `supabase/config.toml` | ✅ ACTUALIZADO | max_duration = 300 |
| `src/utils/replicateApi.ts` | ✅ ACTUALIZADO | Mensajes de progreso mejorados, sin bg removal |
| `src/components/patapete/configurator/PatapeteConfigurator.tsx` | ✅ ACTUALIZADO | Usa compressAndResizeImage, elimina removeBackground |
| `src/utils/canvasCompositing.ts` | ✅ REESCRITO | Slots rectangulares + multiply blend para art generado |
| `src/components/patapete/configurator/CanvasPreview.tsx` | ✅ ACTUALIZADO | Pasa isGenerated a PetCompositeData |
| `src/utils/backgroundRemoval.ts` | ✅ VACIADO | No-op deprecated |
| `src/components/patapete/configurator/PhotoPetForm.tsx` | ✅ ACTUALIZADO | Mensajes de estado correctos |

## Secrets necesarios

| Secret | Estado |
|--------|--------|
| `REPLICATE_API_KEY` | ✅ Ya existe en Supabase |

## Parámetros clave del pipeline

### BiRefNet
- Modelo: `zhengpeng7/birefnet`
- Endpoint: `/v1/models/zhengpeng7/birefnet/predictions`
- Header: `Prefer: wait=55` para respuesta síncrona
- Output: URL de PNG con transparencia

### Smart crop (imagescript@1.2.15)
- Padding: 20% lados, 10% top, 40% bottom del bounding box del sujeto
- Target: 800×800 blanco, sujeto al ~75% de altura

### FLUX Dev img2img
- Endpoint: `/v1/models/black-forest-labs/flux-dev/predictions`
- `prompt_strength: 0.78` (78% texto, 22% imagen)
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

## Posibles mejoras futuras
- IP-Adapter style card para consistencia visual de marca Patapete
- Caché de resultados en Supabase Storage para evitar regenerar
- Opción de regenerar con diferentes strengths
- Soporte para múltiples breeds/razas en el prompt