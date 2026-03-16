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
- **PhotoPetForm rediseñado** — layout horizontal compacto: thumbnail 88×88px a la izquierda, instrucciones/nombre a la derecha.

---

## 🔧 PLAN PENDIENTE: Loading UX Pro (20s wait)

### Problema
- Mensajes técnicos ("BiRefNet + FLUX Dev · ~45s") — el usuario no sabe qué es eso
- El tiempo estimado (~45s) es incorrecto — el proceso real dura ~20s
- Un spinner girando no entretiene ni da sensación de avance
- El usuario puede abandonar durante la espera

### Estrategia (basada en investigación UX)
Para esperas de 15-25 segundos, las mejores prácticas son:
1. **Barra de progreso determinada** — da sensación de control y avance real
2. **Mensajes rotativos emocionales** — storytelling, no tecnicismos
3. **Micro-animaciones** — shimmer/pulse en el thumbnail para que se vea "vivo"
4. **Copy humano y divertido** — "Analizando las orejas de tu perro..." en vez de "BiRefNet"

### Implementación

#### Archivo 1: `src/utils/replicateApi.ts`
Actualizar los progress messages con timing correcto (~20s total) y copy humano:
```
{ delay: 0,     text: 'Analizando tu mascota...' }
{ delay: 4000,  text: 'Detectando rasgos únicos...' }
{ delay: 9000,  text: 'Capturando la personalidad...' }
{ delay: 14000, text: 'Pintando el retrato...' }
{ delay: 18000, text: '¡Casi listo! ✨' }
```
Eliminar cualquier mención de segundos, BiRefNet, FLUX del texto visible.

#### Archivo 2: `src/components/patapete/configurator/PhotoPetForm.tsx`
Rediseñar el estado de loading con:

**En el thumbnail (88×88):**
- Mantener la foto del usuario visible (no overlay opaco)
- Añadir un shimmer/pulse ring animado alrededor del thumbnail con `animate-pulse` y border de color primario
- Remover el overlay con spinner y texto — ese espacio es muy pequeño

**En el lado derecho (flex-1):**
- Mostrar mensaje actual rotativo (`pet.progressMessage` o el `statusMessage` del callback)
- Barra de progreso animada CSS que dura 20s y se llena de 0% a 95% (nunca al 100% hasta que llegue el resultado)
- Usar `useEffect` + `useState` para el % de la barra, con un timer de ~20s
- El texto principal usa copy emocional, NO técnico
- Pequeño texto secundario: "Tu retrato único está siendo creado" 

**Copy de la barra:**
- Usar `transition-all duration-1000` para smooth fill
- La barra arranca en 5%, sube rápido los primeros 5s, luego más lento

**Estructura del componente loading (lado derecho):**
```
[título]: "Creando tu retrato..."
[mensaje rotativo]: "Detectando rasgos únicos..."  ← viene del progress callback
[barra de progreso]: ████████░░░░  65%
[subtexto]: "Cada retrato es único para tu mascota"
```

**Timer de la barra de progreso** (dentro del componente, usando useEffect):
- Start: cuando `isProcessing` cambia a `true`
- Keyframes sugeridos: 5% → 30% en 3s, → 60% en 8s, → 80% en 13s, → 92% en 18s
- Cuando `isProcessing` cambia a `false` (llegó el resultado): animar al 100% rápido
- Reset cuando se limpia la foto

**Props adicionales necesarias:**
- Pasar `progressMessage` como prop desde el padre (PatapeteConfigurator) donde se llama el callback `onProgress`
- O leer directamente desde el `statusMessage` calculado en el form

**Verificar que PatapeteConfigurator pase el mensaje de progreso:**
- Buscar en `PatapeteConfigurator.tsx` dónde se llama `generateTattooArt` con `onProgress`
- Asegurarse que el mensaje se almacene en el estado del Pet y se pase al `PhotoPetForm`

### Archivos a modificar
- `src/utils/replicateApi.ts` — actualizar timing y copy de mensajes
- `src/components/patapete/configurator/PhotoPetForm.tsx` — rediseñar loading UX completo
- `src/components/patapete/configurator/PatapeteConfigurator.tsx` — verificar que `progressMessage` se guarde en estado y se pase al form (puede requerir agregar campo a tipo `Pet`)
- `src/components/patapete/configurator/types.ts` — agregar campo `progressMessage?: string` al tipo `Pet` si no existe