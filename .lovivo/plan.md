# Patapete — Plan del proyecto

## Estado actual
Configurador de tapetes personalizados para mascotas. Funcional con 2 estilos (Tatuaje IA + Vector).

## Cambios recientes
- **Eliminado estilo Ícono de Raza** de todo el codebase (types, PatapeteStyles, PatapetePersonalization, CanvasPreview, StepPets, StepSummary)
- **Eliminados indicadores de pasos** (breadcrumbs) del configurador
- **Flujo simplificado**: CTAs van directo a la vista de configuración (sin paso intermedio de selección de estilo)
- **Selector de estilo integrado** en StepPets, encima del selector de mascotas — selector compacto 2 columnas con Tatuaje IA y Vector
- ConfiguratorState ahora empieza en `step: 1` con `style: 'tattoo'` por defecto
- Solo 2 pasos: Configura (step 1) → Resumen (step 2)

## Estilos disponibles
- **Tatuaje IA** (popular, $649 MXN): foto → background removal → Replicate API → arte estilo tatuaje
- **Vector** ($549 MXN): foto → background removal → filtro vectorial CSS/canvas

## Archivos clave del configurador
```
src/components/patapete/configurator/
  PatapeteConfigurator.tsx   — orquestador principal
  StepPets.tsx               — paso 1: selector estilo + config mascotas
  StepSummary.tsx            — paso 2: resumen + add to cart
  PhotoPetForm.tsx           — upload foto + generar arte
  CanvasPreview.tsx          — preview canvas en tiempo real
  types.ts                   — Style = 'tattoo' | 'vector'
```

## Variantes del producto (IDs reales)
```
tattoo: { 1: '28fc993c...', 2: '1aee4582...', 3: '5f7e007d...' }
vector: { 1: '27cec5b7...', 2: '6527bbc6...', 3: '0adfce44...' }
```

## Próximos pasos (Fase 2)
- Configurar API key de Replicate para que funcione el Tatuaje IA
- Crear Edge Function en Supabase para proxy seguro a Replicate
- Probar el pipeline completo: foto → bg removal → IA → preview