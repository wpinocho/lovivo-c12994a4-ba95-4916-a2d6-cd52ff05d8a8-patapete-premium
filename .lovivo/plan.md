# Store Plan — Patapete
(Auto-actualizado por Lovivo AI)

## Current State
Homepage completa de Patapete está construida y funcional.

## Brand
- **Nombre:** Patapete
- **Producto:** Tapetes de fibra de coco personalizados con arte de mascotas
- **Mercado:** México
- **Estilos:** Tatuaje IA, Vector, Icono
- **Mascotas:** 1 a 3 por tapete

## Design System
- **Fuentes:** Playfair Display (display/headlines), Plus Jakarta Sans (body/sans)
- **Paleta:** Crema cálido (#F8F5F0), carbón suave, terracota primary (hsl 16 58% 42%), arena secundario, verde oliva accent
- **Radius:** 0.75rem
- **Sombras personalizadas:** `shadow-warm`, `shadow-warm-lg`, `shadow-primary`, `shadow-primary-lg`
- **Animaciones:** `fade-up`, `fade-in`, `scale-in`, `slide-in-right`, `float`
- **Clases custom:** `hero-overlay`, `texture-section`, `section-padding`, `card-premium`, `trust-badge`, `headline-display`

## Producto creado
- **ID:** `07e2ec97-5364-495e-a835-0041748553af`
- **Slug:** `tapete-personalizado-patapete`
- **Variantes:** 9 (Estilo × Mascotas: $449–$949 MXN)
- **URL producto:** `/productos/tapete-personalizado-patapete`

## Imágenes generadas (public/)
- `/hero-patapete.jpg` — Hero principal (flux.pro)
- `/style-tattoo.jpg` — Estilo Tatuaje IA
- `/style-vector.jpg` — Estilo Vector
- `/style-icon.jpg` — Estilo Icono
- `/before-after-patapete.jpg` — Transformación foto→arte→tapete
- `/gallery-patapete.jpg` — Galería de tapetes
- `/material-coco.jpg` — Textura fibra de coco
- `/cta-patapete.jpg` — CTA final (flux.pro)

## Archivos clave del proyecto
```
src/
├── components/patapete/
│   ├── PatapeteHero.tsx           ← Hero con imagen, CTAs, trust badges
│   ├── PatapeteTrustStrip.tsx     ← Barra de confianza (5 items)
│   ├── PatapeteHowItWorks.tsx     ← 4 pasos del proceso
│   ├── PatapeteStyles.tsx         ← 3 estilos con cards
│   ├── PatapeteTransformation.tsx ← Antes/después
│   ├── PatapeteGallery.tsx        ← Galería de ejemplos
│   ├── PatapeteBenefits.tsx       ← 6 beneficios
│   ├── PatapetePersonalization.tsx← Personalización + frases
│   ├── PatapeteMaterials.tsx      ← Material + specs del tapete
│   ├── PatapeteFAQ.tsx            ← 7 preguntas frecuentes (accordion)
│   ├── PatapeteFinalCTA.tsx       ← CTA final con imagen
│   └── PatapeteWhatsApp.tsx       ← Botón WhatsApp flotante
├── components/BrandLogoLeft.tsx   ← Logo SVG pata + "Patapete"
├── templates/EcommerceTemplate.tsx← Header Premium (scroll-aware, mobile menu)
└── pages/ui/IndexUI.tsx           ← Homepage principal
```

## WhatsApp
- URL placeholder: `https://wa.me/5215500000000?text=...`
- **PENDIENTE:** El dueño debe actualizar el número de WhatsApp real en `PatapeteWhatsApp.tsx`

## User Preferences
- Estilo: DTC premium, cálido, limpio, emocional
- Tono: Cercano, claro, mexicano natural, orientado a conversión
- Sin: colores chillones, infantil, genérico
- CTA principal siempre: "Diseña tu tapete" / "Diseña el tuyo"

## Active Plan: Futuras Sesiones
### Página de producto / Configurador
- Actualizar `ProductPageUI.tsx` con flujo de configuración:
  1. Upload de foto de mascota
  2. Selector de estilo visual
  3. Campo de nombre/frase
  4. Preview antes de comprar
- Requiere integrar una API de transformación de imagen o flujo manual por WhatsApp

### Colecciones
- Crear colección "Para perros"
- Crear colección "Para gatos"
- Crear colección "Idea de regalo"

### Blog
- Actualizar `blogPosts.ts` con artículos Patapete:
  - "Cómo elegir la foto perfecta para tu tapete"
  - "Los 3 estilos explicados: ¿cuál es el tuyo?"
  - "Ideas de frases para tu tapete"

### SEO
- Agregar JSON-LD structured data para el producto
- Meta description personalizada para homepage
- OG tags para Meta Ads

### Mejoras de diseño
- Testimonios reales (una vez que haya clientes)
- Sección de comparativa de estilos más visual
- Contador de tapetes diseñados (social proof dinámico)