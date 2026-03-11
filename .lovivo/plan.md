# Patapete — Plan de Mejora del Pipeline IA v6

## Diagnóstico (basado en imágenes del usuario)

### Lo que SÍ funciona
- BiRefNet: ✅ remueve el fondo perfectamente (perro en blanco, 0.4s)
- FLUX Dev: ✅ genera ilustración (el pipeline completa sin errores ahora)

### Los 3 problemas reales

**Problema 1 — FLUX genera cuerpo completo, no retrato**
La imagen 3 muestra al perro de cuerpo entero (cabeza + pecho + patas). 
Causa: el smart crop en normalizeImage() expande el bounding box completo del cuerpo y lo centra en 800×800.
Fix: Después de detectar el bbox completo, recortar solo el TOP 50% del sujeto (cabeza + pecho superior). No expandir hacia abajo — el 40% de padding bottom debe eliminarse y reemplazarse por crop del top 55% del subject height.

**Problema 2 — El prompt produce ilustración coloreada, no lineart puro**
La imagen 3 muestra un cartoon con rellenos oscuros y colores (no solo líneas negras sobre blanco).
Con multiply blend sobre la textura café del tapete, eso produce una masa oscura (imagen 4).
Fix: Reescribir prompt para pedir SOLO líneas negras sobre blanco. Agregar negative_prompt explícito. Bajar prompt_strength a 0.72 para que la IA respete más la estructura del perro.

**Problema 3 — Canvas: la imagen se ve pequeña y oscura**
El slot de 1 mascota es H*0.58 = ~232px en un canvas 600×400. Con un perro de cuerpo completo oscuro, multiply lo convierte en sombra.
Fix: Si el crop es correcto (retrato cara+pecho), el slot puede ser más grande. Ajustar slot 1 mascota a H*0.68 (~272px). El multiply funcionará perfecto con lineart puro negro sobre blanco.

---

## Implementación

### Archivo 1: `supabase/functions/generate-tattoo/index.ts`

#### A) Fix smart crop — solo cabeza + pecho (top 55% del sujeto)

En `normalizeImage()`, cambiar la sección de crop expandido:

```typescript
// Actualmente (MALO - captura cuerpo entero):
const padSide   = Math.round(subjectW * 0.20)
const padTop    = Math.round(subjectH * 0.10)
const padBottom = Math.round(subjectH * 0.40)

// NUEVO — Portrait crop: solo top 55% del bounding box (cabeza + pecho)
// Calcular la altura del retrato = 55% del alto del sujeto
const portraitH = Math.round(subjectH * 0.55)
const padSide   = Math.round(subjectW * 0.18)
const padTop    = Math.round(subjectH * 0.08)
// NO padBottom — cortamos el body en portraitH desde el top del sujeto

const cropX = Math.max(0, subjectX0 - padSide)
const cropY = Math.max(0, subjectY0 - padTop)
const cropW = Math.min(img.width  - cropX, subjectW + padSide * 2)
const cropH = Math.min(img.height - cropY, portraitH + padTop)  // solo top 55%
```

#### B) Fix prompt — lineart puro + framing cabeza/pecho

```typescript
const PROMPT = [
  'A premium pet portrait illustration for a decorative doormat.',
  'Close-up of the pet\'s head and upper chest only, no full body, no legs.',
  'Pure clean black outlines on a solid white background.',
  'No fill colors, no shading, only crisp elegant black linework.',
  'Minimalist engraved illustration style, high contrast, product-ready.',
  'The face fills most of the frame. Premium home decor aesthetic.',
].join(' ')

const NEGATIVE_PROMPT = 'full body, legs, paws, colored fill, watercolor, painterly, realistic, 3d render, complex background, photo, text, watermark, neon, abstract'
```

#### C) Fix parámetros FLUX Dev

```typescript
body: JSON.stringify({
  input: {
    prompt: PROMPT,
    negative_prompt: NEGATIVE_PROMPT,  // NUEVO
    image: `data:image/png;base64,${normalizedBase64}`,
    prompt_strength: 0.72,  // Bajado de 0.78 → respetar más la identidad del perro
    num_inference_steps: 30,  // Subido de 28 → mejor calidad lineart
    guidance: 4.0,  // Subido de 3.5 → más adherencia al prompt de lineart
    num_outputs: 1,
    output_format: 'webp',
    output_quality: 95,
    disable_safety_checker: true,
  },
})
```

---

### Archivo 2: `src/utils/canvasCompositing.ts`

#### Fix tamaño del slot — más grande para el retrato

```typescript
case 1: {
  const s = Math.round(H * 0.68)  // Era 0.58 (~232px) → ahora ~272px
  return [{ x: Math.round((W - s) / 2), y: Math.round(cy - s / 2), w: s, h: s }]
}
case 2: {
  const s   = Math.round(H * 0.54)  // Era 0.47 (~188px) → ahora ~216px
  const gap = Math.round(W * 0.04)
  // ...
}
case 3: {
  const s   = Math.round(H * 0.42)  // Era 0.39 (~156px) → ahora ~168px
  const gap = Math.round(W * 0.022)
  // ...
}
```

#### Fix multiply blend — agregar boost de contraste antes del blend

Antes de `ctx.globalCompositeOperation = 'multiply'`, aplicar un pre-boost al canvas para que el lineart sea más contrastado:

```typescript
} else if (pet.isGenerated) {
  // Warm frame
  ctx.strokeStyle = 'rgba(160, 120, 70, 0.4)'
  ctx.lineWidth = 1.5
  ctx.strokeRect(x - 1, y - 1, w + 2, h + 2)

  // Boost contrast: draw a slight warm tint first (so white areas tint to warm cream)
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 0.08
  ctx.fillStyle = '#d4a866'
  ctx.fillRect(x, y, w, h)
  ctx.globalAlpha = 1.0

  // Multiply: white disappears, dark lines "tattoo" the rug
  ctx.globalCompositeOperation = 'multiply'
  ctx.drawImage(img, x, y, w, h)
}
```

---

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/generate-tattoo/index.ts` | Portrait crop (top 55%) + nuevo prompt + negative_prompt + parámetros FLUX |
| `src/utils/canvasCompositing.ts` | Slots más grandes + pre-tint antes de multiply |

## Resultado esperado

- BiRefNet quita fondo → foto de perro sobre blanco
- Smart crop recorta solo cara + pecho (top 55% del subject)
- FLUX genera lineart negro puro sobre blanco (no cartoon coloreado)
- Canvas: multiply blend → las líneas se tatúan sobre la textura del tapete
- Preview: retrato grande, elegante, bien encuadrado

## Notas de calibración post-deploy
- Si el crop queda demasiado alto (solo cara sin cuello), ajustar de 0.55 a 0.60
- Si FLUX sigue poniendo colores, bajar guidance a 4.5 o subir prompt_strength a 0.75
- Si el multiply queda muy oscuro, reducir slot size back a 0.62 para 1 mascota