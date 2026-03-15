# Patapete — Plan del Proyecto

## Estado actual
Tienda de tapetes personalizados para mascotas. El configurador multi-step está funcional con persistencia en localStorage. Messaging actualizado para enfocarse en la mascota, no en la IA.

## Cambios recientes
- **Messaging / Copy:** Eliminadas todas las referencias a "IA" como diferenciador principal en toda la landing:
  - `PatapeteHero.tsx`: subheadline humanizada — "Sube su foto. Ve cómo queda en tu tapete antes de comprarlo — hecho especialmente para ti."
  - `PatapeteHowItWorks.tsx`: Paso 02 → "Tu mascota, convertida en arte" (antes: "La IA crea el retrato")
  - `PatapeteGallery.tsx`: etiquetas sin "· Retrato IA" (ahora solo nombre + n° mascotas)
  - `PatapetePersonalization.tsx`: feature card → "Su retrato artístico, hecho para ti"
  - `PatapeteTransformation.tsx`: pasos → "Retrato único" (antes: "Arte IA")
  - `StepPets.tsx` (configurador): badge → "Solo para tu mascota · Diseño exclusivo"; párrafo → "ve cómo queda en tu tapete antes de pedirlo"
- **Nueva sección testimonios:** `PatapeteTestimonials.tsx` reemplaza `PatapeteStyles.tsx`
  - 4 testimonios con nombre, ciudad, mascota, texto emocional, estrellas
  - Avatares con iniciales (placeholder — usuario proveerá fotos después)
  - Rating agregado: 4.9 · 500+ reseñas
- **Logo real implementado:** `/public/logo.webp` — pata de coco textured marrón/beige
- **Persistencia del configurador:** `localStorage` key `patapete_v1`

## Pendiente
- Usuario proveerá fotos reales de tapetes para la galería (`PatapeteGallery`) y testimonios
- Cuando lleguen las fotos: agregar al `PatapeteTestimonials` y reemplazar placeholder avatars

## User Preferences
- Idioma: Español
- Diferenciador: tapete a la medida con TU mascota — la IA es el cómo, no el qué
- No queremos marketing de IA, queremos marketing emocional de mascotas
- Estilo visual: premium, cálido, cercano

## Archivos clave
- `src/components/BrandLogoLeft.tsx` — logo en header y footer
- `src/templates/EcommerceTemplate.tsx` — layout principal
- `src/components/patapete/configurator/PatapeteConfigurator.tsx` — configurador principal
- `src/components/patapete/configurator/StepPets.tsx` — paso de mascotas
- `src/components/patapete/configurator/types.ts` — tipos compartidos
- `src/components/patapete/PatapeteTestimonials.tsx` — sección de testimonios (nueva)
- `src/pages/ui/IndexUI.tsx` — estructura de la homepage
- `public/logo.webp` — logo oficial Patapete