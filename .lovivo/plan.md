# Patapete — Pipeline v13 ✅

## Estado: IMPLEMENTADO

---

## Flujo actual (v13)

```
User sube foto
  → compressAndResizeImage() cliente
  → generate-tattoo edge function:
      1. BiRefNet (Replicate) → remove background        (~1s)
      2. normalizeImage() → 800×800 white canvas         (~1s)
      3. Claude Haiku 3 (Anthropic) → genera prompt      (~2-3s)
      3.5. [DIBUJO only] compositeImages() →
             pet (LEFT 800px) + style reference (RIGHT 800px)
             = 1600×800 PNG como image_prompt para FLUX
      4. FLUX 2 Pro → arte final                         (~15s)
         · DIBUJO: image_prompt = composite LEFT+RIGHT, strength 0.3
                   text prompt = "LEFT=pet to recreate, RIGHT=target style. {{haikuPrompt}}"
         · ICONO:  image_prompt = pet photo alone, strength 0.15
                   text prompt = haikuPrompt directo
  → mostrar al user
```

**Total estimado: ~20s**

---

## Estrategia image_prompt por estilo (v13)

| Style | image_prompt | strength | Prompt text |
|-------|-------------|----------|-------------|
| `dibujo` | Composite 1600×800: pet LEFT + style reference RIGHT | 0.30 | "LEFT image = pet to recreate, RIGHT image = exact style to apply. {{haikuPrompt}}" |
| `icono` | Foto normalizada del perro sola | 0.15 | haikuPrompt directo |

**URL imagen de referencia DIBUJO:**
`https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773343362868-fzlwnjfa0z8.webp`

---

## Logging completo v13

Cada paso emite en los logs de Supabase:

| Step | INPUT logged | OUTPUT logged |
|------|-------------|---------------|
| 1 BiRefNet | model version, base64 length | transparent PNG URL |
| 2 Normalize | transparent PNG URL | 800×800 base64 length |
| 3 Haiku | style, model, full system prompt, base64 length | full prompt text |
| 3.5 Composite | pet base64 len, style base64 len, decoded dims | composite base64 len |
| 4 FLUX | style, image source, strength, **full prompt text**, dims | result URL |

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
- `supabase/functions/generate-tattoo/index.ts` — Pipeline completo v13

---

## Secretos requeridos
- `REPLICATE_API_KEY` ✅
- `ANTHROPIC_API_KEY` ✅

---

## Notas de calibración
- Si FLUX no diferencia bien las dos mitades, subir `image_prompt_strength` para DIBUJO (0.3 → 0.4)
- Si el perro no se parece al user, revisar el prompt de Haiku en los logs (Step 3 OUTPUT)
- Los logs ahora muestran el prompt COMPLETO que va a FLUX en Step 4 INPUT para debuggear
- composite: petImg LEFT (0,0) + styleImg RIGHT (800,0) en canvas 1600×800