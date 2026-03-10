# Patapete — Plan del proyecto

## Estado actual
Configurador de tapetes personalizados para mascotas. Funcional con 2 estilos (Tatuaje IA + Vector).

## Cambios recientes
- Eliminado estilo Ícono de Raza completamente
- Eliminados indicadores de pasos
- Flujo simplificado: CTAs van directo al configurador (step 1 con style: 'tattoo' por defecto)
- Selector de estilo integrado en StepPets (2 columnas compacto)
- Solo 2 pasos: Configura (step 1) → Resumen (step 2)

## Estilos disponibles
- **Tatuaje IA** (popular, $649 MXN): foto → bg removal → Replicate API → arte estilo tatuaje
- **Vector** ($549 MXN): foto → bg removal → filtro vectorial CSS/canvas

## Archivos clave del configurador
```
src/components/patapete/configurator/
  PatapeteConfigurator.tsx   — orquestador principal
  StepPets.tsx               — paso 1: selector estilo + config mascotas
  StepSummary.tsx            — paso 2: resumen + add to cart
  PhotoPetForm.tsx           — upload foto + generar arte
  CanvasPreview.tsx          — preview canvas en tiempo real
  types.ts                   — Style = 'tattoo' | 'vector'
src/utils/
  canvasCompositing.ts       — lógica canvas: tapete mockup + pet images
  backgroundRemoval.ts       — @imgly/background-removal (browser, gratis)
  vectorFilter.ts            — efecto vectorial CSS/canvas (browser, gratis)
  replicateApi.ts            — llamada a Replicate (MIGRAR a edge function)
```

## Variantes del producto (IDs reales)
```
tattoo: { 1: '28fc993c...', 2: '1aee4582...', 3: '5f7e007d...' }
vector: { 1: '27cec5b7...', 2: '6527bbc6...', 3: '0adfce44...' }
```

---

## 🚀 FASE ACTUAL: Preview con demo images + Pipeline completo

### Lo que hacen TeeInBlue / PawPeludo (reverse engineering)
Su truco es simple pero poderoso:
1. Tienen **imágenes demo pre-procesadas** (PNGs transparentes de mascotas ejemplo) guardadas en CDN (Cloudflare) como webp pequeños
2. Al cargar el configurador, el canvas renderiza INMEDIATAMENTE el tapete con esas fotos demo ya colocadas → el usuario ve un tapete bonito y completo desde el primer segundo
3. Conforme el usuario va configurando (sube su foto, se procesa) → se van reemplazando las fotos demo con las del usuario, slot por slot
4. Las imágenes demo son muy pequeñas (~2-5KB cada una) porque son ilustraciones simples

### Arquitectura tecnológica decidida

**Remove Background:** `@imgly/background-removal` — corre 100% en el navegador con WebAssembly. SIN API, SIN COSTO. Ya implementado. ✅

**Efecto Vector:** `vectorFilter.ts` con canvas CSS filters — 100% navegador, SIN API, SIN COSTO. Ya implementado. ✅

**Tatuaje IA:** Replicate API — usuario YA tiene API key. 
- NO exponer el API key en el frontend
- Crear **Supabase Edge Function** como proxy seguro
- El frontend manda la imagen → Edge Function → Replicate → devuelve URL resultado
- Costo: ~$0.003 USD por imagen generada

**Demo images:** Guardadas en `public/demo/` como PNGs transparentes pequeños
- No necesitamos Supabase Storage para esto (son assets estáticos del proyecto)
- 3 variantes: 1 mascota, 2 mascotas, 3 mascotas
- Necesitamos crear o conseguir las imágenes demo

---

## Plan de implementación

### Paso 1: Demo images en CanvasPreview
**Archivo:** `src/components/patapete/configurator/CanvasPreview.tsx`
**Archivo:** `src/utils/canvasCompositing.ts`

Cambiar lógica en CanvasPreview:
- Cuando NO hay `generatedArtUrl` ni `photoPreviewUrl` en ninguna mascota → mostrar **tapete con demo images** en vez de "Tu tapete aparecerá aquí"
- Demo images según cuántas mascotas están seleccionadas (petCount):
  - 1 mascota → 1 imagen demo centrada
  - 2 mascotas → 2 imágenes demo
  - 3 mascotas → 3 imágenes demo
- Cuando el usuario sube foto y se procesa → reemplazar esa mascota específica con su arte real
- Efecto visual suave: las demo images tienen una leve opacidad/overlay para distinguirse del resultado real

Demo images paths (las vamos a crear/generar):
```
public/demo/pet-demo-1.png  (golden retriever, estilo tatuaje, PNG transparente)
public/demo/pet-demo-2.png  (labrador, estilo tatuaje, PNG transparente) 
public/demo/pet-demo-3.png  (beagle, estilo tatuaje, PNG transparente)
```

En `canvasCompositing.ts`, modificar `compositeRug()` para aceptar un flag `isDemo?: boolean` por pet slot, y cuando es demo renderizarlo con menor opacidad (0.65) para que se vea como "ejemplo".

En `CanvasPreview.tsx`:
```typescript
// Construir petData: si el pet NO tiene imagen real, usar demo image
const DEMO_IMAGES = ['/demo/pet-demo-1.png', '/demo/pet-demo-2.png', '/demo/pet-demo-3.png']
const petData: PetCompositeData[] = pets.map((pet, i) => ({
  imageUrl: pet.generatedArtUrl || pet.photoPreviewUrl || DEMO_IMAGES[i % 3],
  name: pet.name,
  isDemo: !pet.generatedArtUrl && !pet.photoPreviewUrl,
}))
// SIEMPRE renderizar (hasSomething = true siempre)
```

### Paso 2: Supabase Edge Function para Replicate
**Archivo nuevo:** `supabase/functions/generate-tattoo/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY')!
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  
  try {
    const { imageBase64, petName } = await req.json()
    
    const prompt = `tattoo art style portrait of a ${petName || 'pet'}, fine line botanical tattoo, black ink on white, detailed stippling, elegant botanical decorations, wreath frame, high contrast, professional tattoo flash sheet style`
    
    // Start prediction
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: '5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637',
        input: {
          image: imageBase64,
          prompt,
          go_fast: true,
          guidance: 3.5,
          num_outputs: 1,
          aspect_ratio: '1:1',
          output_format: 'webp',
          output_quality: 90,
          num_inference_steps: 4,
        },
      }),
    })
    
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.detail || 'Replicate error')
    }
    
    const prediction = await response.json()
    
    // Poll for result (max 90s)
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 1500))
      const poll = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { 'Authorization': `Token ${REPLICATE_API_KEY}` }
      })
      const result = await poll.json()
      
      if (result.status === 'succeeded') {
        return new Response(JSON.stringify({ url: result.output[0] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      if (result.status === 'failed') throw new Error(result.error || 'Generation failed')
    }
    
    throw new Error('Timeout')
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
```

**Secret a configurar en Supabase:**
- `REPLICATE_API_KEY` → la key del usuario

### Paso 3: Actualizar frontend para usar Edge Function
**Archivo:** `src/utils/replicateApi.ts`

Reemplazar la llamada directa a Replicate con llamada a la Edge Function de Supabase:

```typescript
import { supabase } from '@/lib/supabase'

export async function generateTattooArt(
  imageBase64: string,
  petName: string,
  onProgress?: TattooProgressCallback
): Promise<string> {
  onProgress?.('Enviando imagen a la IA...')
  
  const { data, error } = await supabase.functions.invoke('generate-tattoo', {
    body: { imageBase64, petName }
  })
  
  if (error) throw new Error(error.message)
  if (!data?.url) throw new Error('No se recibió imagen de la IA')
  
  onProgress?.('¡Arte generado!')
  return data.url
}
```

No se necesita polling en el frontend porque la Edge Function hace el polling y solo responde cuando está listo.

### Paso 4: Demo images - generarlas o usar placeholder
Para las demo images necesitamos 3 PNGs de mascotas con fondo transparente, en estilo tatuaje o vector. Opciones:
1. Generar con IA y guardar como `public/demo/pet-demo-1.png`, etc.
2. Usar ilustraciones SVG simples de mascotas (perro, gato, etc.)

Se pueden crear en Craft Mode con prompts de IA generativas o descargar ilustraciones libres de derechos.

### Paso 5: Instrucciones para el usuario (MANUAL - no código)
El usuario debe:
1. Ir a Supabase Dashboard → Edge Functions → Secrets
2. Agregar secret: `REPLICATE_API_KEY` = su API key de Replicate
3. O ejecutar: `supabase secrets set REPLICATE_API_KEY=r8_...`

---

## Resumen de tecnologías finales
| Función | Tecnología | Costo | Dónde corre |
|---------|-----------|-------|-------------|
| Remove BG | @imgly/background-removal | GRATIS | Navegador |
| Efecto Vector | Canvas CSS filters | GRATIS | Navegador |
| Tatuaje IA | Replicate via Edge Function | ~$0.003/imagen | Supabase → Replicate |
| Demo preview | PNG estáticos en /public | GRATIS | Navegador |
| Canvas compositing | HTML Canvas | GRATIS | Navegador |

## Próximos pasos (en orden)
1. [x] Crear demo images (3 PNGs transparentes de mascotas)
2. [ ] Actualizar CanvasPreview para usar demo images por defecto
3. [ ] Actualizar canvasCompositing para soporte isDemo (opacidad reducida)  
4. [ ] Crear Edge Function `generate-tattoo` en Supabase
5. [ ] Refactorizar replicateApi.ts para llamar a la Edge Function
6. [ ] Usuario agrega REPLICATE_API_KEY como secret en Supabase Dashboard
7. [ ] Probar pipeline completo: foto → bg removal → IA/vector → preview