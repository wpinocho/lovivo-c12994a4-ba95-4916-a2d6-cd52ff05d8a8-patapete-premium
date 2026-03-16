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

## ✅ BUG RESUELTO: Blanco del perro se borraba al compositar

### Solución implementada (v18)
**BiRefNet en el output de FLUX** (Paso 5.5 en la edge function). El modelo entiende semánticamente dónde está el sujeto vs. el fondo, preservando áreas blancas del propio animal.

### Pipeline actual (v18)
```
Paso 1: BiRefNet en foto del usuario → transparent PNG
Paso 2: Smart crop + normalize → 800×800 white canvas  
Paso 3: Upload normalized pet → public URL
Paso 4: Claude Haiku → optimized prompt
Paso 5: FLUX 2 Pro → cartoon art (white background, temp URL)
Paso 5.5: BiRefNet en output de FLUX → transparent PNG URL  ← NUEVO
Paso 6: Download transparent PNG, upload permanente como PNG  ← NUEVO
Return: transparent PNG URL
```

### Cambios realizados
- `supabase/functions/generate-tattoo/index.ts` — v18, nueva función `removeBackgroundFromFluxOutput()`, `uploadFinalArt` sube `.png` en lugar de `.webp`, paso 5.5 añadido al pipeline
- `src/utils/canvasCompositing.ts` — Para `isGenerated`, ya NO llama `removeWhiteBackground()` (PNG ya viene transparente del servidor). `isDemo` sigue usando removeWhiteBackground.

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