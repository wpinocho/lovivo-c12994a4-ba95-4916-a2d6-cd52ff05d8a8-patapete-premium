# Patapete — Estado del Pipeline IA

## Estado Actual: v7 implementada ✅

## Lo que hace el pipeline ahora

### Fase 1 — Frontend
- Usuario sube foto → compresión 1024×1024 PNG en browser → envío a edge

### Fase 2 — Edge function `generate-tattoo`
1. **BiRefNet** (men1scus/birefnet, versión f74986db) → elimina fondo, retorna PNG transparente
2. **Portrait crop** → detecta bbox del sujeto con imagescript, recorta solo el **top 55%** (cara + pecho), pad 18% lados + 8% top, escala a 82% de 800px
3. **FLUX Dev img2img** → `prompt_strength: 0.72`, 30 steps, `guidance: 4.0` → retorna URL de imagen

### Fase 3 — Canvas frontend (`canvasCompositing.ts`)
- **Canvas cuadrado 600×600** (antes era 600×400)
- **Nuevo mat**: beige claro (coir natural sobre ladrillo) — funciona perfecto con multiply
- **Object-cover** para el mat: center-crop a square, sin letterbox
- Slots ajustados para canvas cuadrado: 1 mascota = H×0.58, 2 = H×0.44, 3 = H×0.30
- **Sin strokeRect** (era lo que causaba el recuadro visible)
- **Sin pre-tint** (no necesario con mat claro)
- `multiply` blend puro: líneas negras se tatúan, fondo blanco desaparece

## Prompt actual (v6 — sin cambios)
```
Premium pet portrait illustration for a decorative doormat.
Close-up of head and upper chest ONLY. No full body. No legs. No paws.
Pure BLACK outlines on solid WHITE background only.
No color fills. No shading. No gradients. Only crisp black linework.
Minimalist engraved line art style. High contrast. Product-ready.
Face fills most of the frame. Premium home decor aesthetic.
```

## Notas de calibración (post-deploy)
- Si el crop queda muy alto (solo cara sin cuello): cambiar `0.55` → `0.60`
- Si FLUX sigue coloreando: bajar `prompt_strength` a `0.68`
- Si el multiply queda muy oscuro (mat demasiado oscuro en esa zona): verificar URL del mat
- Si el recuadro vuelve a ser visible: es porque el FLUX no generó fondo blanco puro → bajar `prompt_strength`
- Si 1 mascota se ve muy chica: subir slot a `H * 0.62`

## Archivos clave
| Archivo | Rol |
|---------|-----|
| `supabase/functions/generate-tattoo/index.ts` | Pipeline completo: BiRefNet → portrait crop → FLUX |
| `src/utils/canvasCompositing.ts` | Preview en canvas cuadrado (600×600), multiply blend |
| `src/components/patapete/configurator/CanvasPreview.tsx` | `aspect-square` para preview grande |
| `src/components/patapete/configurator/StepPets.tsx` | Layout 2 columnas: preview izquierda, form derecha |
| `supabase/config.toml` | `verify_jwt = false` para generate-tattoo |

## Mat mockup URL
```
https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773256082834-gf5g5a3no07.webp
```
(beige coir mat sobre ladrillo, más claro que el mat anterior)