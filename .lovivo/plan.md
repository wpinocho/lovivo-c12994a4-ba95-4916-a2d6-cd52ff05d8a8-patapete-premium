# Patapete — Pipeline v12 ✅

## Estado: IMPLEMENTADO

---

## Flujo actual (v12)

```
User sube foto
  → compressAndResizeImage() cliente
  → generate-tattoo edge function:
      1. BiRefNet (Replicate) → remove background        (~1s)
      2. normalizeImage() → 800×800 white canvas         (~1s)
      3. Claude Haiku 3 (Anthropic) → genera prompt      (~2-3s)
      4. FLUX 2 Pro → arte final                         (~15s)
         · DIBUJO: image_prompt = style reference (B&W line art), strength 0.25
         · ICONO:  image_prompt = pet photo normalizada, strength 0.15
  → mostrar al user
```

**Total estimado: ~20s**

---

## Estrategia image_prompt por estilo

| Style | image_prompt | strength | Razón |
|-------|-------------|----------|-------|
| `dibujo` | Imagen de referencia B&W line art (style-dibujo.webp) | 0.25 | La foto real del perro "jala" hacia fotorrealismo; la referencia de estilo guía a FLUX hacia line art |
| `icono` | Foto normalizada del perro | 0.15 | Preservar colores y rasgos del perro real |

**URL de imagen de referencia DIBUJO:**
`https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773343362868-fzlwnjfa0z8.webp`

---

## Estilos disponibles

| Style | Descripción | Prompt template |
|-------|-------------|-----------------|
| `dibujo` | Líneas negras gruesas, estilo sello/linocut B&W | SYSTEM_PROMPT_DIBUJO en edge fn |
| `icono` | Vector flat colorido, minimalista | SYSTEM_PROMPT_ICONO en edge fn |

---

## Archivos clave

- `src/components/patapete/configurator/types.ts` — Style = 'dibujo' | 'icono', PRICES, STYLE_LABELS
- `src/components/patapete/configurator/StepPets.tsx` — Selector Dibujo/Icono
- `src/components/patapete/configurator/PatapeteConfigurator.tsx` — state.style, handleStyleChange
- `src/utils/replicateApi.ts` — Acepta style, mensajes de progreso
- `supabase/functions/generate-tattoo/index.ts` — Pipeline completo v12

---

## Logging v12

Cada paso emite:
- `Step N INPUT` — parámetros enviados (tamaño base64, modelo, fuente de image_prompt)
- `Step N OUTPUT` — resultado recibido (URL, longitud base64)
- Timing individual por paso
- `PIPELINE START` y `PIPELINE COMPLETE` con tiempo total

---

## Fix v12 (2025-03-12)
**Problema**: Foto real del perro como `image_prompt` en FLUX jalaba hacia fotorrealismo, contradiciendo el estilo B&W del prompt.
**Solución**: Para DIBUJO, usar imagen de referencia de estilo (B&W line art peekaboo) como `image_prompt` con strength 0.25. Pet features vienen del prompt de Haiku.
**También**: Logging comprehensivo en todos los pasos para facilitar debugging.

---

## Secretos requeridos
- `REPLICATE_API_KEY` ✅
- `ANTHROPIC_API_KEY` ✅ (agregado en v11)

---

## Notas de calibración
- Si FLUX no sigue bien el estilo, subir `image_prompt_strength` para DIBUJO (0.25 → 0.35)
- Si el perro no se parece al usuario, bajar strength (0.25 → 0.15) y mejorar prompt de Haiku
- Los logs ahora muestran exactamente qué imagen y parámetros van a cada step