# Patapete — Plan del Proyecto

## Estado actual
Tienda de tapetes personalizados con IA para mascotas. El configurador multi-step está funcional con persistencia en localStorage.

## Cambios recientes
- **Logo real implementado:** `/public/logo.webp` — pata de coco textured marrón/beige con fondo transparente
  - `BrandLogoLeft.tsx` ahora usa `<img src="/logo.webp" />` en lugar del SVG genérico
  - `index.html` favicon actualizado a `/logo.webp` (con apple-touch-icon también)
- **Persistencia del configurador:** `localStorage` key `patapete_v1` guarda estilo, mascotas, fotos (base64), generatedArtUrl y frases
- **Configurador PatapeteConfigurator:** multi-step con estilos Dibujo/Icono, soporte para 1-3 mascotas

## User Preferences
- Idioma: Español
- Estilo: Dibujo a la derecha (default), Icono a la izquierda
- Logo: imagen real de pata de fibra de coco (marrón/beige)

## Archivos clave
- `src/components/BrandLogoLeft.tsx` — logo en header y footer
- `src/templates/EcommerceTemplate.tsx` — layout principal
- `src/components/patapete/configurator/PatapeteConfigurator.tsx` — configurador principal
- `src/components/patapete/configurator/StepPets.tsx` — paso de mascotas
- `src/components/patapete/configurator/types.ts` — tipos compartidos
- `public/logo.webp` — logo oficial Patapete