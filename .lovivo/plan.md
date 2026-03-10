# Patapete — Plan del proyecto

## Estado actual
Configurador de tapetes personalizados para mascotas. Funcional con 2 estilos (Tatuaje IA + Vector).

## Cambios recientes
- Eliminado estilo Ícono de Raza completamente
- Eliminados indicadores de pasos
- Flujo simplificado: CTAs van directo al configurador (step 1 con style: 'tattoo' por defecto)
- Selector de estilo integrado en StepPets (2 columnas compacto)
- Solo 2 pasos: Configura (step 1) → Resumen (step 2)
- **NUEVO:** Demo images (3 PNGs tattoo art style) en `public/demo/`
- **NUEVO:** CanvasPreview ahora siempre muestra el tapete con demo images al cargar
- **NUEVO:** canvasCompositing soporta `isDemo` → opacidad 0.55 + borde punteado
- **NUEVO:** Edge Function `supabase/functions/generate-tattoo/index.ts` para Replicate
- **NUEVO:** replicateApi.ts migrado a edge function segura (no expone API key)

## Estilos disponibles
- **Tatuaje IA** (popular, $649 MXN): foto → bg removal → Edge Function → Replicate API → arte tatuaje
- **Vector** ($549 MXN): foto → bg removal → filtro vectorial CSS/canvas

## Archivos clave del configurador
```
src/components/patapete/configurator/
  PatapeteConfigurator.tsx   — orquestador principal
  StepPets.tsx               — paso 1: selector estilo + config mascotas
  StepSummary.tsx            — paso 2: resumen + add to cart
  PhotoPetForm.tsx           — upload foto + generar arte
  CanvasPreview.tsx          — preview canvas en tiempo real (con demo images)
  types.ts                   — Style = 'tattoo' | 'vector'
src/utils/
  canvasCompositing.ts       — lógica canvas: tapete mockup + pet images (isDemo support)
  backgroundRemoval.ts       — @imgly/background-removal (browser, gratis)
  vectorFilter.ts            — efecto vectorial CSS/canvas (browser, gratis)
  replicateApi.ts            — llama a edge function generate-tattoo
supabase/functions/
  generate-tattoo/index.ts   — Edge Function: proxy seguro a Replicate API ✅
public/demo/
  pet-demo-1.png             — Golden retriever, tattoo line art ✅
  pet-demo-2.png             — French bulldog, tattoo line art ✅
  pet-demo-3.png             — Labrador, tattoo line art ✅
```

## Variantes del producto (IDs reales)
```
tattoo: { 1: '28fc993c...', 2: '1aee4582...', 3: '5f7e007d...' }
vector: { 1: '27cec5b7...', 2: '6527bbc6...', 3: '0adfce44...' }
```

## Secret configurado en Supabase
- `REPLICATE_API_KEY` — ya configurado por el usuario ✅

## Cómo funciona el preview con demo images
1. Al cargar el configurador → tapete aparece inmediatamente con demo images (opacidad 55%, borde punteado)
2. Badge en el tapete: "Ejemplo · Sube tu foto para ver tu mascota"
3. Usuario sube foto → se procesa (bg removal + arte IA/vector) → reemplaza el slot demo
4. Cuando al menos una mascota tiene imagen real → badge desaparece

## Resumen de tecnologías finales
| Función | Tecnología | Costo | Dónde corre |
|---------|-----------|-------|-------------|
| Remove BG | @imgly/background-removal | GRATIS | Navegador |
| Efecto Vector | Canvas CSS filters | GRATIS | Navegador |
| Tatuaje IA | Replicate via Edge Function | ~$0.003/img | Supabase → Replicate |
| Demo preview | PNG estáticos en /public/demo | GRATIS | Navegador |
| Canvas compositing | HTML Canvas | GRATIS | Navegador |

## Próximos pasos posibles
- Probar pipeline completo: foto → bg removal → IA/vector → preview
- Verificar que los nombres de mascotas aparecen correctamente en el canvas
- Considerar agregar más demo images (gatos, otras razas)
- Optimizar tamaño de las demo images (actualmente ~1MB, podrían ser webp pequeños)