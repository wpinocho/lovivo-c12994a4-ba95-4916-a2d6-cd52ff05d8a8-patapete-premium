# Patapete — Pipeline implementado ✅

## Estado: IMPLEMENTADO

---

## Flujo actual (v10)

```
User sube foto
  → compressAndResizeImage() cliente
  → generate-tattoo edge function:
      1. BiRefNet (Replicate) → remove background
      2. normalizeImage() → 800×800 white canvas (imagescript)
      3. lucataco/ollama-llama3.2-vision-11b → genera prompt según style
      4. FLUX 2 Pro (black-forest-labs/flux-2-pro) → arte final
  → mostrar al user
```

---

## Estilos disponibles

| Style | Descripción | Prompt template |
|-------|-------------|-----------------|
| `dibujo` | Líneas negras gruesas, estilo sello/linocut B&W | SYSTEM_PROMPT_DIBUJO en edge fn |
| `icono` | Vector flat colorido, minimalista | SYSTEM_PROMPT_ICONO en edge fn |

---

## Archivos modificados

- `src/components/patapete/configurator/types.ts` — Style = 'dibujo' | 'icono', PRICES, STYLE_LABELS
- `src/components/patapete/configurator/StepPets.tsx` — Selector Dibujo/Icono encima del selector de mascotas
- `src/components/patapete/configurator/PatapeteConfigurator.tsx` — state.style = 'dibujo', handleStyleChange, pasa style a StepPets y generateTattooArt
- `src/utils/replicateApi.ts` — Acepta style, mensajes de progreso actualizados para 4 pasos
- `supabase/functions/generate-tattoo/index.ts` — Pipeline completo con 4 pasos

---

## Fix v10 (2025-03-12)
**Problema**: `meta/llama-3.2-11b-vision-instruct` daba 404 — ese path no existe en Replicate.
**Solución**: Cambiado a `lucataco/ollama-llama3.2-vision-11b:d4e81fc1472556464f1ee5cea4de177b2fe95a6eaadb5f63335df1ba654597af` via `/v1/predictions` con version hash. El system_prompt se combina en el campo `prompt` ya que este modelo no tiene campo `system_prompt` separado. Timeout extendido a 90s (ollama puede tardar en boot).

---

## Parámetros clave FLUX 2 Pro
- `image_prompt`: imagen normalizada (base64 data URI)
- `image_prompt_strength`: 0.15 (baja influencia de imagen — guiado principalmente por prompt de Llama)
- Modelo: `black-forest-labs/flux-2-pro` vía `/v1/models/{model}/predictions`

## Parámetros Llama 3.2 Vision (ollama)
- Modelo: `lucataco/ollama-llama3.2-vision-11b:d4e81fc1472556464f1ee5cea4de177b2fe95a6eaadb5f63335df1ba654597af`
- Input: `image` (data URI) + `prompt` (system + user instrucciones combinadas)
- Poll timeout: 90s (puede tardar en boot la primera vez)

---

## Notas de calibración
- Si FLUX 2 Pro no usa la imagen suficiente, subir `image_prompt_strength` (0.15 → 0.25)
- Si el prompt de Llama es muy largo, revisar system prompts en la edge fn
- Los logs de la edge function muestran el prompt generado por Llama — útil para debugging
- `style` default si no viene en body: `'dibujo'`

---

## Secretos requeridos
- `REPLICATE_API_KEY` ✅ (ya configurado desde versión anterior)