# Patapete — Plan del Proyecto

## Estado Actual
El configurador de tapetes está funcionando bien. Los dos estilos (DIBUJO e ICONO) generan retratos IA correctamente. El previsualizador canvas ahora tiene coordenadas ajustadas para mostrar el layout correcto.

## Stack Técnico
- Edge function: `supabase/functions/generate-tattoo/index.ts`
- Canvas compositor: `src/utils/canvasCompositing.ts`
- Configurador: `src/components/patapete/configurator/`
- AI pipeline: BiRefNet (bg removal) → Claude Haiku (prompt) → FLUX 2 Pro (generación)
- Tiempo total: ~24s (79% es FLUX 2 Pro)

## Decisiones Clave

### Estilos de Arte
- **DIBUJO**: Blanco y negro, estilo sello/grabado, líneas gruesas negras
- **ICONO**: Vector colorido, flat colors, contornos negros gruesos

### Prompts (Claude Haiku)
- `SYSTEM_PROMPT_DIBUJO`: Analiza mascota → genera retrato BN con línea de patas en borde inferior
- `SYSTEM_PROMPT_ICONO`: Extrae colores exactos del pelaje → genera retrato vector colorido

### Canvas Layout (600×600)
```
Y_PAW = 415         // línea de patitas (borde superior del tapete ~y=390 en canvas)
Y_CLIP = 438        // clip del arte hasta aquí (muestra ~23px de patitas)
Y_PHRASE_BTM = 474  // frase "arriba" dentro del tapete
PAW_RATIO = 0.76    // la línea de patitas está al 76% desde arriba del arte FLUX
```

**Slots de mascotas (anclados en Y_PAW):**
- 1 mascota: s=220px, slot_y = 415 - 220*0.76 = 248
- 2 mascotas: s=172px, slot_y = 415 - 172*0.76 = 284
- 3 mascotas: s=142px, slot_y = 415 - 142*0.76 = 307

**Orden de dibujo:**
1. Rug mockup (fondo)
2. Arte de mascotas con clip a Y_CLIP (peekaboo: cabeza sobre el tapete, patitas visibles)
3. Frase (pill oscuro, "arriba" dentro del tapete, en Y_PHRASE_BTM=474)
4. Nombres de mascotas (bajo la frase, en Y_PHRASE_BTM + 26 si hay frase, o Y_PAW + 52 si no)

## Bugs Resueltos

### Bug #1 — Estilo siempre "dibujo" (closure desactualizada)
- `handleGenerate` en `PatapeteConfigurator.tsx` tenía `[state.pets]` en deps array
- Faltaba `state.style` → siempre capturaba el valor inicial 'dibujo'
- Solución: usar `styleRef` (useRef) que siempre tiene el valor más reciente

### Bug #2 — ICONO devolvía resultado tipo DIBUJO
- URL de referencia estaba en bucket temporal `message-images` (inaccesible para Replicate)
- `SYSTEM_PROMPT_ICONO` no forzaba extracción de colores
- Prompt FLUX para ICONO no especificaba "FULL COLOR"
- Solución: URL permanente en `product-images`, prompts reescritos con énfasis en color

### Bug #3 — Tamaño de mascotas demasiado grande en previsualizador
- Slots calculados como fracción del canvas total (H*0.58 = 348px para 1 mascota)
- Frase dibujada en H-18 = 582px (fuera del tapete visible)
- Solución: slots anclados a Y_PAW con PAW_RATIO, tamaños fijos más pequeños, frase reposicionada

## Archivos Clave
- `src/utils/canvasCompositing.ts` — Lógica de composición del canvas
- `src/components/patapete/configurator/CanvasPreview.tsx` — Preview en vivo
- `src/components/patapete/configurator/StepPets.tsx` — Paso de configuración de mascotas
- `src/components/patapete/configurator/StepSummary.tsx` — Resumen y add to cart
- `src/components/patapete/configurator/PatapeteConfigurator.tsx` — Orquestador principal
- `supabase/functions/generate-tattoo/index.ts` — Edge function de generación IA

## Variantes del Producto (variant IDs fijos)
```
1 mascota: '28fc993c-e638-459b-9a00-08abacdc9f32'
2 mascotas: '1aee4582-040b-477a-b335-e99446fa76c7'
3 mascotas: '5f7e007d-b30e-44c8-baa6-5aa03edb23ad'
```