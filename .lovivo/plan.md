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

## ✅ BUG RESUELTO: Blanco del perro se borraba al compositar (v18+v19)
- Pipeline v18: BiRefNet en foto del usuario (paso 1) + BiRefNet en output de FLUX (paso 5.5)
- Fix frontend: CanvasPreview distingue imágenes generadas (no aplica removeWhiteBackground) vs demos (sí aplica)

## Prompts IA (Edge Function generate-tattoo)

### ICONO (v3 — referencia provista por usuario)
- Referencia: Border Terrier peekaboo illustration — colores sólidos, líneas bold, fondo claro
- URL: `https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773698793129-msnlow463lm.webp`

### DIBUJO (v1 — b&w linocut)
- Referencia: `style-dibujo.png` (b&w line art)

---

## 🔧 PENDIENTE: Migrar BiRefNet → rembg para eliminar tiempos de cola altos

### Problema
`men1scus/birefnet` corre en A100 con alta demanda → cola de 7–26s antes de correr
El modelo en sí tarda <1s, pero la espera destruye la UX.

### Solución: cambiar AMBAS llamadas de BiRefNet a `cjwbw/rembg`

Benchmarks reales:
- men1scus/birefnet: cola 7–26s + 700ms running = hasta 27s
- cjwbw/rembg: cola ~14ms + 1.2s running = ~1.2s total

rembg usa U2Net que es semántico (entiende sujeto vs fondo), no pixel-based, así que:
- Paso 1 (foto usuario): aísla la mascota correctamente
- Paso 5.5 (cartoon FLUX): fondo blanco puro → rembg lo maneja perfecto, preserva patitas blancas

### Implementación en `supabase/functions/generate-tattoo/index.ts`

**Paso 1: Cambiar `removeBackgroundBiRefNet()`**

Modelo actual: `version: 'f74986db0355b58403ed20963af156525e2891ea3c2d499bfbfb2a28cd87c5d7'`
Endpoint actual: `https://api.replicate.com/v1/predictions` con `version`

Cambio: usar `cjwbw/rembg` via su endpoint de modelo:
```
POST https://api.replicate.com/v1/models/cjwbw/rembg/predictions
body: {
  input: {
    image: `data:image/png;base64,${imageBase64}`,
    model: 'u2net'  // u2net es el mejor para mascotas/animales
  }
}
```
El output es una URL a PNG transparente (igual que BiRefNet).

**Paso 2: Cambiar `removeBackgroundFromFluxOutput()`**

Misma lógica — cambiar al mismo modelo `cjwbw/rembg`.
El input aquí es una URL pública de Replicate (FLUX output), no base64.
```
input: {
  image: fluxUrl,
  model: 'u2net'
}
```

**Notas técnicas:**
- `cjwbw/rembg` usa el endpoint de modelo (no versión), así que la URL es diferente: `https://api.replicate.com/v1/models/cjwbw/rembg/predictions`
- El campo `Prefer: wait=60` sigue siendo válido para esperar el resultado sincrónicamente
- El output format es el mismo: URL a imagen PNG con transparencia
- El polling helper `pollReplicate` sigue igual

**Archivo a modificar:**
- `supabase/functions/generate-tattoo/index.ts` — reemplazar las dos funciones de background removal

**Versión del archivo después del cambio: v19**

### Ahorro de tiempo estimado
- Pipeline actual: ~2 BiRefNet calls × ~15s promedio = ~30s solo en colas
- Pipeline nuevo: ~2 rembg calls × ~1.2s = ~2.4s
- Ahorro: ~27-28 segundos en el pipeline total 🚀