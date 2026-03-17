# Performance Audit — Patapete

## Diagnóstico
Revisión completa de archivos de rendimiento: `index.html`, `index.css`, `PatapeteHero.tsx`, `PatapeteGallery.tsx`, `PatapeteTestimonials.tsx`.

## Problemas encontrados (por impacto)

### 🔴 CRÍTICO — 16 fuentes de Google cargando en index.html (línea 11)
El `index.html` carga UNA sola línea de Google Fonts que incluye: DM Sans, Inter, Lato, Lora, Merriweather, Montserrat, Nunito, Open Sans, Playfair Display, Plus Jakarta Sans, Poppins, Raleway, Roboto, Space Grotesk, Work Sans + todas sus variantes de peso. Patapete solo usa DOS: **Playfair Display** y **Plus Jakarta Sans**. Esto genera un CSS de ~300KB y docenas de archivos de fuente que se descargan innecesariamente. Impacto estimado: +1-2 segundos en mobile.

### 🔴 CRÍTICO — @import duplicado en index.css (línea 1)
`index.css` tiene un `@import url('https://fonts.googleapis.com/...')` adicional con solo Playfair Display + Plus Jakarta Sans. Este `@import` es render-blocking (bloquea el pintado de la página hasta que termina de cargar). El CSS import debe eliminarse y mantenerse solo el `<link>` en el HTML (que ya no bloquea gracias a `display=swap`).

### 🟡 IMPORTANTE — Sin preload del hero image (LCP)
La imagen hero (`PatapeteHero.tsx` línea 17) es el elemento más grande visible al cargar (LCP - Largest Contentful Paint). No tiene `<link rel="preload">` en el `<head>`. Agregarlo puede mejorar LCP en ~300-500ms ya que el browser la empieza a descargar mientras procesa el HTML, antes de leer el JS.

### 🟡 IMPORTANTE — html lang="en" incorrecto
El `<html lang="en">` debe ser `<html lang="es">`. Afecta accesibilidad y SEO en mercados hispanohablantes.

### 🟢 MENOR — Twitter meta apunta a lovable.dev
`twitter:image` y `twitter:site` apuntan a `@lovable_dev` y logos de Lovable, no de Patapete.

## Soluciones a implementar

### Fix 1: index.html — Limpiar Google Fonts
Reemplazar la línea 11 de index.html con SOLO las dos fuentes que usa Patapete:
```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

### Fix 2: index.html — Agregar preload del hero image
Agregar después del preconnect de fonts:
```html
<link rel="preload" as="image" href="https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773711547270-gl2w41jlm5.webp" fetchpriority="high">
```

### Fix 3: index.html — Cambiar lang
`<html lang="en">` → `<html lang="es">`

### Fix 4: index.css — Eliminar @import de fuentes
Eliminar la línea 1 de `src/index.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:...');
```
(ya está cubierta por el `<link>` en el HTML que no bloquea el render)

### Fix 5: index.html — Twitter meta corregido
```html
<meta name="twitter:site" content="@patapete_mx" />
<meta name="twitter:image" content="/logo.webp" />
```

## Archivos a modificar
- `index.html`: Fixes 1, 2, 3, 5
- `src/index.css`: Fix 4 (eliminar línea @import)

## Impacto esperado
- Reducción de ~1.5-2s en carga inicial (mobile 4G)
- Mejora en LCP (Core Web Vital más importante para SEO/conversión)
- ~280KB menos de CSS/fuentes descargadas innecesariamente