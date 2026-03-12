# Patapete — Nuevo Pipeline con Estilos + Claude Haiku + FLUX 2 Pro

## Estado: PENDIENTE DE IMPLEMENTAR

---

## Qué queremos lograr
1. Selector de estilo **Dibujo / Icono** encima del selector de mascotas en `StepPets`
2. Nuevo paso intermedio en el backend: **Claude Haiku 3 (visión)** analiza la imagen normalizada y genera un prompt optimizado según el estilo
3. Cambiar de **FLUX Dev** a **FLUX 2 Pro** (`black-forest-labs/flux-2-pro`) para la generación final
4. El pipeline completo queda: Compress → BiRefNet → Normalize → Claude Haiku → FLUX 2 Pro

---

## ⚠️ Prerrequisito: Secret ANTHROPIC_API_KEY
El usuario debe agregar `ANTHROPIC_API_KEY` en Supabase Dashboard → Edge Functions → Secrets.
Sin esto, el paso de Claude Haiku fallará.

---

## Archivos a modificar

### 1. `src/components/patapete/configurator/types.ts`
- Cambiar `Style = 'tattoo'` → `Style = 'dibujo' | 'icono'`
- Actualizar `STYLE_LABELS`: `{ dibujo: 'Dibujo', icono: 'Icono' }`
- Actualizar `PRICES` con los nuevos keys (mantener los mismos valores de precio o ajustar)
  ```typescript
  export type Style = 'dibujo' | 'icono'
  export const STYLE_LABELS: Record<Style, string> = {
    dibujo: 'Dibujo',
    icono: 'Icono',
  }
  export const PRICES: Record<Style, Record<1 | 2 | 3, number>> = {
    dibujo: { 1: 649, 2: 799, 3: 949 },
    icono:  { 1: 649, 2: 799, 3: 949 },
  }
  ```

### 2. `src/components/patapete/configurator/StepPets.tsx`
- Agregar prop `style: Style` y `onStyleChange: (style: Style) => void`
- Agregar selector visual **Dibujo / Icono** ENCIMA del selector de cantidad de mascotas
- UI: dos botones toggle con icono, igual estilo que el selector de cantidad actual
- El selector de estilo debe ser sticky/visible — es la primera decisión del usuario
- Actualizar `price` para usar `PRICES[style][petCount]` en vez de hardcoded `PRICES['tattoo'][petCount]`
- Pasar `style` al `CanvasPreview` (ambas instancias desktop y mobile)
- Ejemplo de UI del selector:
  ```tsx
  <div className="space-y-2">
    <Label className="text-sm font-semibold">¿Qué estilo prefieres?</Label>
    <div className="grid grid-cols-2 gap-3">
      <button onClick={() => onStyleChange('dibujo')} className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all',
        style === 'dibujo' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
      )}>
        {/* Icon: Pen or similar */}
        <span className="font-semibold text-sm">Dibujo</span>
        <span className="text-xs text-muted-foreground">Líneas negras, estilo sello</span>
      </button>
      <button onClick={() => onStyleChange('icono')} className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all',
        style === 'icono' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
      )}>
        {/* Icon: Palette or PawPrint */}
        <span className="font-semibold text-sm">Icono</span>
        <span className="text-xs text-muted-foreground">Vector colorido, minimalista</span>
      </button>
    </div>
  </div>
  ```

### 3. `src/components/patapete/configurator/PatapeteConfigurator.tsx`
- Cambiar `style: 'tattoo'` initial state → `style: 'dibujo'` (o 'icono', a decidir cuál es default)
- Agregar `handleStyleChange` callback
- Pasar `style` y `onStyleChange` a `<StepPets>`
- En `handleGenerate`, pasar `state.style` a `generateTattooArt()`

### 4. `src/utils/replicateApi.ts`
- Agregar parámetro `style: 'dibujo' | 'icono'` a `generateTattooArt()`
- Pasarlo en el body de la llamada a la edge function: `{ imageBase64, petName, style }`
- Actualizar mensajes de progreso para reflejar los nuevos pasos:
  ```typescript
  { delay: 0,     text: 'Analizando tu mascota...' },
  { delay: 5000,  text: 'Removiendo fondo con IA...' },
  { delay: 14000, text: 'Analizando rasgos y generando descripción...' },
  { delay: 25000, text: 'Creando retrato con FLUX 2 Pro... (~40s)' },
  { delay: 55000, text: 'Casi listo...' },
  ```

### 5. `supabase/functions/generate-tattoo/index.ts` — CAMBIO MAYOR
Nuevo pipeline completo:

```
Compress (client) 
  → BiRefNet bg removal (Replicate) 
  → normalizeImage() 800×800 (imagescript) — SIN CAMBIOS
  → Claude Haiku 3 vision → genera prompt optimizado según style
  → FLUX 2 Pro (Replicate) con prompt generado + imagen normalizada
```

#### Cambios específicos:

**A) Aceptar `style` en el body:**
```typescript
const { imageBase64, petName, style } = await req.json()
// style: 'dibujo' | 'icono'
```

**B) Nueva función `generatePromptWithClaude(normalizedBase64, style)`:**

Llama a Anthropic API con Claude Haiku 3:
- URL: `https://api.anthropic.com/v1/messages`
- Model: `claude-3-haiku-20240307`
- Headers: `x-api-key: ANTHROPIC_API_KEY`, `anthropic-version: 2023-06-01`
- Envía la imagen normalizada como `image` en el mensaje con el system prompt según estilo

**System prompt para "icono":**
```
Eres un director de arte experto. Tu tarea es analizar la foto de esta mascota y generar un prompt de generación de imagen para un modelo texto-a-imagen.

Analiza la imagen y extrae lo siguiente:

Tipo de animal y raza aproximada.

Textura del pelo (ej. liso y corto, esponjoso, alambre/scruffy).

Colores principales (ej. café chocolate con marcas cobrizas).

Rasgos distintivos CRÍTICOS y accesorios (ej. ojos azul claro muy llamativos, orejas caídas, collar/paliacate simplificado a un solo color).

Ahora, toma esa información y REEMPLAZA los corchetes en esta plantilla exacta (mantén la plantilla en inglés). Devuelve ÚNICAMENTE el texto de la plantilla completada, sin introducciones ni explicaciones:

A standardized minimalist 'peekaboo' portrait of a [TIPO DE ANIMAL Y RAZA APROXIMADA], head and upper chest ONLY, centered, paws resting on a solid, thick black horizontal line at the bottom. ISOLATED SUBJECT on a PURE ABSOLUTE WHITE BACKGROUND (#FFFFFF).
STYLE: Minimalist flat vector illustration, highly simplified graphic art. The entire portrait is constructed using thick, clean, bold black outlines.
CRITICAL: The fur texture is [TEXTURA DEL PELO], represented using simplified, defined shapes of color. DO NOT USE stippling, dots, or hatching lines. Use ONLY SOLID, FLAT COLORS (cell-shaded style). Strictly simplify all accessories to solid colors with NO complex patterns.
LIMITED COLOR PALETTE: [COLORES PRINCIPALES DEL PELO]. Solid black for outlines. Pink tongue. CRITICAL IDENTIFYING FEATURES TO PRESERVE: [RASGOS DISTINTIVOS CRÍTICOS Y ACCESORIOS]. Print-ready, stencil-like simplicity for coarse materials.
```

**System prompt para "dibujo":**
```
Eres un director de arte experto. Tu tarea es analizar la foto de esta mascota y generar un prompt de generación de imagen para un retrato en puro blanco y negro, estilo sello o grabado de líneas gruesas.

Analiza la imagen y extrae ÚNICAMENTE información estructural (ignora los colores del pelaje, ya que el diseño será blanco y negro):

Tipo de animal y raza aproximada.

Rasgos físicos estructurales más distintivos (ej. orejas muy grandes y caídas, hocico chato, arrugas profundas, pelo muy rizado en forma de bloques).

Accesorios visibles (ej. lleva un collar grueso o un paliacate).

Ahora, toma esa información y REEMPLAZA los corchetes en esta plantilla exacta (mantén la plantilla en inglés). Devuelve ÚNICAMENTE el texto de la plantilla completada, sin introducciones ni explicaciones:

A standardized 'peekaboo' portrait of a [TIPO DE ANIMAL Y RAZA APROXIMADA], head and upper chest ONLY, centered, paws on a solid border line at the bottom. ISOLATED SUBJECT on a PURE ABSOLUTE WHITE BACKGROUND (#FFFFFF).
STYLE: Pure black and white minimalist line art. ONLY black ink on white background. NO grayscale, NO shading, NO fine details.
CRITICAL: The entire portrait is constructed using ONLY extremely thick, chunky, bold black lines. The drawing lines should be slightly imperfect and heavy, resembling a bold linocut, rubber stamp, or stencil print.
PRESERVE KEY STRUCTURAL FEATURES: [RASGOS FÍSICOS ESTRUCTURALES Y ACCESORIOS], but strictly abstract and simplify them into this chunky, heavy-line graphic execution. No thin strokes. Stencil-like simplicity ready for coarse material printing.
```

**Implementación de generatePromptWithClaude:**
```typescript
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

const SYSTEM_PROMPT_ICONO = `...` // el prompt de icono arriba
const SYSTEM_PROMPT_DIBUJO = `...` // el prompt de dibujo arriba

async function generatePromptWithClaude(normalizedBase64: string, style: 'dibujo' | 'icono'): Promise<string> {
  const systemPrompt = style === 'icono' ? SYSTEM_PROMPT_ICONO : SYSTEM_PROMPT_DIBUJO
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: normalizedBase64,
              },
            },
            {
              type: 'text',
              text: 'Analiza esta imagen y genera el prompt según las instrucciones.',
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Claude Haiku error: ${err}`)
  }

  const result = await response.json()
  const generatedPrompt = result.content?.[0]?.text
  if (!generatedPrompt) throw new Error('Claude Haiku returned empty response')
  
  console.log('[generate-tattoo] Claude generated prompt:', generatedPrompt)
  return generatedPrompt.trim()
}
```

**C) Nueva función `generateWithFlux2Pro(normalizedBase64, prompt)`:**
```typescript
async function generateWithFlux2Pro(normalizedBase64: string, prompt: string): Promise<string> {
  const response = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-2-pro/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${REPLICATE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: {
        prompt,
        image: `data:image/png;base64,${normalizedBase64}`,
        image_prompt_strength: 0.15,  // baja fuerza de imagen — principalmente guiado por prompt
        output_format: 'webp',
        output_quality: 95,
        safety_tolerance: 5,
        width: 1024,
        height: 1024,
      },
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(`FLUX 2 Pro error: ${JSON.stringify(err)}`)
  }

  const prediction = await response.json()
  if (!prediction.id) throw new Error('FLUX 2 Pro: no prediction ID')

  const result = await pollReplicate(prediction.id, 120)
  const out = result.output
  const url = Array.isArray(out) ? out[0] : out
  if (!url) throw new Error('FLUX 2 Pro returned no image URL')
  return url
}
```

**D) Actualizar el main handler:**
```typescript
// 1. Remove background (BiRefNet) — sin cambios
// 2. Normalize 800×800 — sin cambios
// 3. Claude Haiku → generate optimized prompt
const optimizedPrompt = await generatePromptWithClaude(normalizedBase64, style || 'dibujo')
// 4. FLUX 2 Pro → final art (reemplaza generateWithFluxDev)
const artUrl = await generateWithFlux2Pro(normalizedBase64, optimizedPrompt)
```

---

## Notas de implementación
- El estilo default en `PatapeteConfigurator` debería ser `'dibujo'` (más fácil de verificar visualmente que funciona)
- Si `style` no viene en el body (backward compat), default a `'dibujo'`
- `image_prompt_strength` en FLUX 2 Pro puede necesitar ajuste — empezar con `0.15` y calibrar
- Si FLUX 2 Pro no acepta `image` directamente como img2img, intentar con `image_prompt` en vez de `image`
- Los logs de la edge function mostrarán el prompt generado por Claude — útil para debugging

---

## Checklist de implementación
- [ ] types.ts: Style = 'dibujo' | 'icono'
- [ ] StepPets.tsx: agregar props style + onStyleChange, UI del selector
- [ ] PatapeteConfigurator.tsx: state style, handler, pasar a StepPets y handleGenerate
- [ ] replicateApi.ts: agregar style param
- [ ] generate-tattoo/index.ts: Claude Haiku step + FLUX 2 Pro
- [ ] Usuario agrega ANTHROPIC_API_KEY en Supabase Dashboard → Edge Functions → Secrets