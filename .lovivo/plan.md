# Patapete — Estado del Pipeline IA

## Estado Actual: v8 implementada ✅

## Fix v8: Padding uniforme (aplicado)

### Cambio en `normalizeImage` (supabase/functions/generate-tattoo/index.ts)

**Antes (v5/v7 — ROTO para close-ups):**
- Tomaba el top 55% del bounding box → cortaba la cabeza en fotos cercanas
- Scale por `img.height` → diferente comportamiento en fotos horizontales vs verticales

**Después (v8 — funciona para todos los tipos):**
```typescript
// Padding uniforme en todos lados: 15% del lado más grande del bounding box
const pad = Math.round(Math.max(subjectW, subjectH) * 0.15)
const cropX = Math.max(0, subjectX0 - pad)
const cropY = Math.max(0, subjectY0 - pad)
const cropW = Math.min(img.width  - cropX, subjectW + pad * 2)
const cropH = Math.min(img.height - cropY, subjectH + pad * 2)

// Scale por lado más largo → consistente para cualquier orientación
const targetSize = 800
const longestSide = Math.max(img.width, img.height)
const scale = (targetSize * 0.88) / longestSide
```

### Por qué funciona para todos los tipos de imagen
- **Close-up (ya es retrato):** solo recorta el padding de BiRefNet, sujeto llena el frame → FLUX recibe cara completa
- **Cuerpo completo:** sujeto ocupa el 88% del canvas → FLUX ve cuerpo completo pero el prompt dice "head and upper chest ONLY" → FLUX genera portrait
- **No hay corte artificial** que pueda eliminar partes del sujeto

### Prompt (sin cambios — ya maneja la composición)
```
Premium pet portrait illustration for a decorative doormat.
Close-up of head and upper chest ONLY. No full body. No legs. No paws.
Pure BLACK outlines on solid WHITE background only.
No color fills. No shading. No gradients. Only crisp black linework.
Minimalist engraved line art style. High contrast. Product-ready.
Face fills most of the frame. Premium home decor aesthetic.
```

### Params FLUX (sin cambios)
- `prompt_strength: 0.72`
- `num_inference_steps: 30`
- `guidance: 4.0`

## Notas de calibración (post-deploy)
- Si FLUX sigue coloreando: bajar `prompt_strength` a `0.68`
- Si el multiply queda muy oscuro: verificar URL del mat
- Si el sujeto se ve muy chico: subir el `0.88` a `0.92`
- Si el sujeto toca los bordes: bajar el pad de `0.15` a `0.12`

## Mat mockup URL
```
https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773256082834-gf5g5a3no07.webp
```

## Archivos clave
| Archivo | Rol |
|---------|-----|
| `supabase/functions/generate-tattoo/index.ts` | Pipeline completo: BiRefNet → normalize (padding uniforme v8) → FLUX |
| `src/utils/canvasCompositing.ts` | Preview en canvas cuadrado (600×600), multiply blend |
| `src/components/patapete/configurator/CanvasPreview.tsx` | `aspect-square` para preview grande |
| `src/components/patapete/configurator/StepPets.tsx` | Layout 2 columnas: preview izquierda, form derecha |
| `supabase/config.toml` | `verify_jwt = false` para generate-tattoo |