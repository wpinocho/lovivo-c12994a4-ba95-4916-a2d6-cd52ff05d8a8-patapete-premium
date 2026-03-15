# Patapete — Plan de trabajo

## Estado actual
Patapete es una tienda de tapetes personalizados con retratos de mascotas. Tiene un configurador interactivo (2 pasos: StepPets + StepSummary) que se muestra en la página de producto para el slug `tapete-personalizado-patapete`.

## Posicionamiento estratégico
- **Pivot confirmado**: de "IA generadora de tapetes" → "tapete personalizado con tu mascota querida"
- La IA es invisible (el cómo), no el protagonista
- Messaging: identidad premium, cercana, humana, emocional

## Cambios implementados

### Fase 1 — Messaging y copywriting (completado)
- Testimonios (nueva sección) con 4 reviews emocionales y rating 4.9
- Hero, How-it-works, Configurador, Galería: todos sin referencias a "IA"

### Fase 2 — CRO de página de producto (completado)
Archivos creados/modificados:
- `src/components/patapete/ProductSocialProof.tsx` — Stars 4.9/5 + "+500 tapetes" + "14 personas configurando ahora" + 3 mini reviews con imagen real del tapete
- `src/components/patapete/ProductFAQ.tsx` — FAQ accordion de 6 preguntas clave (garantía, material, tiempo, foto, preview)
- `src/pages/ui/ProductPageUI.tsx` — ProductSocialProof encima + ProductFAQ debajo del configurador
- `src/components/patapete/configurator/StepSummary.tsx` — Añadidos:
  - Specs strip (60×40cm, fibra de coco, 5-7 días)
  - Guarantee card verde (Garantía Patapete)
  - Trust badges actualizados (sin "Garantía" duplicada)
  - Timeline "¿Qué pasa después?" con 4 pasos
  - Fix: "Arte: Retrato IA" → usa STYLE_LABELS[style] dinámico
  - Fix: PRICES[style][petCount] en lugar de hardcoded 'dibujo'
  - Fix: CanvasPreview usa el style correcto
- `src/components/patapete/configurator/PatapeteConfigurator.tsx` — Pasa `style={state.style}` a StepSummary

## Imagen del tapete real
URL: `https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773605369513-eutj0l5ssem.webp`
Usada en: review de "Ana T." en ProductSocialProof

## Pendiente
- Usuario generará fotos reales de tapetes con mascotas/clientes para reemplazar placeholders en testimonios y mini reviews
- Potencial: agregar más fotos reales en las reviews de ProductSocialProof (initials "CM" y "SP" no tienen imagen aún)