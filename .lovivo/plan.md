# Patapete — Estado del Pipeline IA

## Estado Actual: v6 implementada ✅

## Lo que hace el pipeline ahora

### Fase 1 — Frontend
- Usuario sube foto → compresión 1024×1024 PNG en browser → envío a edge

### Fase 2 — Edge function `generate-tattoo`
1. **BiRefNet** (men1scus/birefnet, versión f74986db) → elimina fondo, retorna PNG transparente
2. **Portrait crop** → detecta bbox del sujeto con imagescript, recorta solo el **top 55%** (cara + pecho), pad 18% lados + 8% top, escala a 82% de 800px
3. **FLUX Dev img2img** → `prompt_strength: 0.72`, 30 steps, `guidance: 4.0` → retorna URL de imagen

### Fase 3 — Canvas frontend (`canvasCompositing.ts`)
- Slots más grandes: 1 mascota = H×0.68, 2 = H×0.54, 3 = H×0.42
- Pre-tint cálido 8% antes del multiply
- `multiply` blend: líneas negras "se tatúan" sobre la textura del tapete

## Prompt actual (v6)
```
Premium pet portrait illustration for a decorative doormat.
Close-up of head and upper chest ONLY. No full body. No legs. No paws.
Pure BLACK outlines on solid WHITE background only.
No color fills. No shading. No gradients. Only crisp black linework.
Minimalist engraved line art style. High contrast. Product-ready.
Face fills most of the frame. Premium home decor aesthetic.
```
FLUX Dev no soporta `negative_prompt` nativo → los negativos están incrustados en el prompt principal.

## Notas de calibración (post-deploy)
- Si el crop queda muy alto (solo cara sin cuello): cambiar `0.55` → `0.60`
- Si FLUX sigue coloreando: bajar `prompt_strength` a `0.68`
- Si el multiply queda muy oscuro: reducir slot a `0.62` para 1 mascota
- Si el multiply queda muy claro (líneas tenues): subir pre-tint a `0.12`

## Archivos clave
| Archivo | Rol |
|---------|-----|
| `supabase/functions/generate-tattoo/index.ts` | Pipeline completo: BiRefNet → portrait crop → FLUX |
| `src/utils/canvasCompositing.ts` | Preview en canvas con multiply blend |
| `src/components/patapete/configurator/` | UI del configurador |
| `supabase/config.toml` | `verify_jwt = false` para generate-tattoo |