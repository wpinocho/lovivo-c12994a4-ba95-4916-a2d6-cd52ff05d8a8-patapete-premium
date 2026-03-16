# Patapete — Plan del Proyecto

## Estado General
Tienda de tapetes personalizados con mascotas. El configurador interactivo (`PatapeteConfigurator`) genera retratos de mascotas con IA (FLUX) y los compone sobre un mockup de tapete.

## Arquitectura de Almacenamiento
- Assets estáticos en `public/` del repo (mismo origen, sin CORS, sin expiración)
- Imágenes demo: `public/demos/icono-0.webp`, `icono-1.webp`, `icono-2.webp`
- Tapete mockup: `public/tapete-mockup.webp`

## Estado del Estilo
- **Estilo activo: `icono`** — siempre forzado en estado inicial y tras cargar localStorage
- Estilo `dibujo` oculto hasta tener sus imágenes demo

## ✅ BUG CRÍTICO A RESOLVER: Blanco del perro se borra al compositar

### Problema
El frontend usa `removeWhiteBackground()` (threshold pixel-based, umbral 238) para quitar el fondo blanco antes de compositar el arte FLUX sobre el tapete. Esto es destructivo: borra también áreas blancas del propio perro (pecho, patitas, boca). Ejemplo: chihuahua con pecho blanco quedaba sin pecho en el tapete.

### Solución aprobada
**Correr BiRefNet en el output de FLUX** (dentro de la edge function, antes de guardar el resultado permanente). BiRefNet es un modelo AI de segmentación que entiende dónde está el sujeto vs. el fondo, a diferencia del umbral de píxeles que no puede diferenciar "fondo blanco" de "pelaje blanco".

### Cambios necesarios

#### 1. `supabase/functions/generate-tattoo/index.ts`
Reestructurar el pipeline para añadir un **Paso 5: BiRefNet en el output de FLUX** (antes del upload permanente):

```
Paso 1: BiRefNet en foto del usuario → transparent PNG
Paso 2: Smart crop + normalize → 800×800 white canvas  
Paso 3: Upload normalized pet → public URL
Paso 4: Claude Haiku → optimized prompt
Paso 5: FLUX 2 Pro → cartoon art (white background, temp URL)
[NUEVO] Paso 5.5: BiRefNet en output de FLUX → transparent PNG URL
[NUEVO] Paso 6: Download transparent PNG, upload permanente como PNG (no webp)
Return: transparent PNG URL
```

Renombrar `uploadFinalArt` para que suba como `image/png` en lugar de `image/webp`, y guardar en `finals/TIMESTAMP.png`.

Añadir función `removeBackgroundFromFluxOutput(fluxUrl: string): Promise<string>` que:
- Descarga la imagen de FLUX (es una URL pública de Replicate)
- Convierte a base64
- Llama a BiRefNet igual que en el Paso 1 pero pasando la URL directamente (no necesita base64, BiRefNet acepta URLs)
- Retorna la URL del transparent PNG

**IMPORTANTE**: BiRefNet acepta `image` como URL directamente (no necesita base64). Usar `image: fluxUrl` en el input.

#### 2. `src/utils/canvasCompositing.ts`
Para imágenes `isGenerated`, ya NO llamar `removeWhiteBackground()` — el PNG ya viene transparente de la edge function.

Cambiar:
```ts
const drawUrl = (pet.isGenerated || pet.isDemo)
  ? await removeWhiteBackground(pet.imageUrl)
  : pet.imageUrl
```

Por:
```ts
// isGenerated: transparent PNG from edge function (BiRefNet already removed bg)
// isDemo: demo illustrations that need white bg removed client-side
const drawUrl = pet.isDemo
  ? await removeWhiteBackground(pet.imageUrl)
  : pet.imageUrl
```

Esto significa:
- `isGenerated = true` → usa el PNG directamente (ya transparente del server)
- `isDemo = true` → sigue usando removeWhiteBackground (demos son ilustraciones con bg blanco)
- raw upload → sin cambios (semi-transparente 0.72 alpha)

## Bug corregido: Imagen de referencia ICONO incorrecta (v2 — usuario proveyó imagen)
- URL nueva: `https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773698793129-msnlow463lm.webp`
- Edge function actualizada con nueva URL ✅

## Bug corregido: Cache al borrar imagen (X button) ✅

## Cambios Recientes
- Bug fix: estilo `icono` ahora se fuerza correctamente incluso al cargar desde localStorage
- **PhotoPetForm rediseñado** — layout horizontal compacto: thumbnail 88×88px a la izquierda
- **Loading UX Pro implementado** ✅:
  - Mensajes rotativos emocionales en `replicateApi.ts` (4s, 9s, 14s, 18s)
  - `progressMessage` añadido al tipo `Pet` y al `DEFAULT_PET`
  - Barra de progreso ease-out (rápido al inicio, lento al final)
  - Glow pulsante alrededor del thumbnail durante generación

## Prompts IA (Edge Function generate-tattoo)

### ICONO (v3 — referencia provista por usuario)
- Referencia: Border Terrier peekaboo illustration — colores sólidos, líneas bold, fondo claro
- URL: `https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773698793129-msnlow463lm.webp`

### DIBUJO (v1 — b&w linocut)
- Referencia: `style-dibujo.png` (b&w line art)

## Archivos a modificar (próximo cambio)
- `supabase/functions/generate-tattoo/index.ts` — Añadir BiRefNet en output de FLUX (nuevo paso 5.5), upload como PNG transparente
- `src/utils/canvasCompositing.ts` — Para `isGenerated`, skip `removeWhiteBackground` (ya viene transparente)