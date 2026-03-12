# Patapete — Pipeline v11 ✅

## Estado: IMPLEMENTADO

---

## Flujo actual (v11)

```
User sube foto
  → compressAndResizeImage() cliente
  → generate-tattoo edge function:
      1. BiRefNet (Replicate) → remove background        (~1s)
      2. normalizeImage() → 800×800 white canvas         (~1s)
      3. Claude Haiku 3 (Anthropic) → genera prompt      (~2-3s)
      4. FLUX 2 Pro (black-forest-labs/flux-2-pro) → arte final  (~15s)
  → mostrar al user
```

**Total estimado: ~20s** (vs ~63s con Llama/Ollama en v10)

---

## Estilos disponibles

| Style | Descripción | Prompt template |
|-------|-------------|-----------------|
| `dibujo` | Líneas negras gruesas, estilo sello/linocut B&W | SYSTEM_PROMPT_DIBUJO en edge fn |
| `icono` | Vector flat colorido, minimalista | SYSTEM_PROMPT_ICONO en edge fn |

---

## Archivos clave

- `src/components/patapete/configurator/types.ts` — Style = 'dibujo' | 'icono', PRICES, STYLE_LABELS
- `src/components/patapete/configurator/StepPets.tsx` — Selector Dibujo/Icono encima del selector de mascotas
- `src/components/patapete/configurator/PatapeteConfigurator.tsx` — state.style = 'dibujo', handleStyleChange, pasa style a StepPets y generateTattooArt
- `src/utils/replicateApi.ts` — Acepta style, mensajes de progreso actualizados para 4 pasos
- `supabase/functions/generate-tattoo/index.ts` — Pipeline completo v11

---

## Fix v11 (2025-03-12)
**Problema**: Llama/Ollama en Replicate tardaba ~46 segundos en Step 3 (cold boot del contenedor Ollama).
**Solución**: Reemplazado por **Claude Haiku 3** (`claude-3-haiku-20240307`) via Anthropic API directa. Tiempo estimado: 2-3s. System prompts idénticos, sólo cambia el cliente de API.

---

## Fix v10 (2025-03-12)
**Problema**: `meta/llama-3.2-11b-vision-instruct` daba 404.
**Solución**: Cambiado a `lucataco/ollama-llama3.2-vision-11b` — pero era lento (~46s). Reemplazado en v11.

---

## Parámetros clave FLUX 2 Pro
- `image_prompt`: imagen normalizada del user (base64 data URI) ✅
- `image_prompt_strength`: 0.15 (baja influencia de imagen — guiado principalmente por prompt de Haiku)
- Modelo: `black-forest-labs/flux-2-pro` vía `/v1/models/{model}/predictions`

## Parámetros Claude Haiku 3
- Endpoint: `https://api.anthropic.com/v1/messages`
- Model: `claude-3-haiku-20240307`
- Input: imagen PNG base64 + instrucción de texto
- Headers: `x-api-key`, `anthropic-version: 2023-06-01`

---

## Notas de calibración
- Si FLUX 2 Pro no usa la imagen suficiente, subir `image_prompt_strength` (0.15 → 0.25)
- Los logs de la edge function muestran el prompt generado por Haiku y el tiempo exacto en ms

---

## Secretos requeridos
- `REPLICATE_API_KEY` ✅
- `ANTHROPIC_API_KEY` ✅ (agregado en v11)