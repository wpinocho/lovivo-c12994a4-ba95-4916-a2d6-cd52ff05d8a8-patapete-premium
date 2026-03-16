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

## Cambios Recientes
- Bug fix: estilo `icono` ahora se fuerza correctamente incluso al cargar desde localStorage
- Prompt de Haiku para `icono` actualizado con extracción detallada
- **PhotoPetForm rediseñado** — layout horizontal compacto: thumbnail 88×88px a la izquierda
- **Loading UX Pro implementado** ✅:
  - Mensajes rotativos emocionales en `replicateApi.ts` (4s, 9s, 14s, 18s — timing ~20s real)
  - `progressMessage` añadido al tipo `Pet` y al `DEFAULT_PET`
  - `PatapeteConfigurator` guarda el mensaje en el estado del pet vía `updatePet({ progressMessage: status })`
  - `PhotoPetForm`: barra de progreso ease-out (rápido al inicio, lento al final), sin overlay sobre la foto, glow pulsante alrededor del thumbnail, copy emocional

## Loading UX — Detalles de Implementación

### Curva ease-out de la barra
Milestones: 8% → 28% (2s) → 48% (5s) → 64% (9s) → 76% (13s) → 86% (17s) → 93% (21s) → 100% (al recibir resultado)

### Mensajes rotativos
- 0s: "Analizando tu mascota..."
- 4s: "Detectando rasgos únicos..."
- 9s: "Capturando la personalidad..."
- 14s: "Pintando el retrato..."
- 18s: "¡Casi listo! ✨"

### Archivos modificados
- `src/utils/replicateApi.ts` — timing y copy actualizados
- `src/components/patapete/configurator/types.ts` — `progressMessage: string` en Pet y DEFAULT_PET
- `src/components/patapete/configurator/PatapeteConfigurator.tsx` — onProgress guarda en estado
- `src/components/patapete/configurator/PhotoPetForm.tsx` — loading UX completo