# PataPete — Plan de Optimización

## Estado Actual
Tienda de tapetes personalizados con mascota (PataPete). Producto principal: tapete con retrato IA de tu mascota ($649–$949 MXN).

## Flujo de Compra Actual (post-optimización)
```
ProductPage (configurador)
├── StepPets: sube foto, elige estilo, textos
│   ├── [¡Ordenar ahora! →] (primario) ──────→ /pagar (checkout directo)
│   └── [Ver mi tapete] (secundario/outline) ──→ StepSummary
│
└── StepSummary: preview + resumen del pedido
    ├── [¡Ordenar ahora! →] (primario) ──────→ /pagar (checkout directo)
    └── [← Volver a configurar] ─────────────→ StepPets
```

## Archivos Clave
- `src/components/patapete/configurator/PatapeteConfigurator.tsx` — orquestador
- `src/components/patapete/configurator/StepPets.tsx` — step 1: configurar
- `src/components/patapete/configurator/StepSummary.tsx` — step 2: resumen
- `src/components/patapete/configurator/CanvasPreview.tsx` — canvas preview
- `src/components/patapete/configurator/PhotoPetForm.tsx` — upload + IA
- `src/components/patapete/configurator/types.ts` — tipos y precios

## Variantes de Producto (IDs reales)
- 1 mascota: `28fc993c-e638-459b-9a00-08abacdc9f32`
- 2 mascotas: `1aee4582-040b-477a-b335-e99446fa76c7`
- 3 mascotas: `5f7e007d-b30e-44c8-baa6-5aa03edb23ad`

## Precios
- Estilo Icono: 1→$649, 2→$799, 3→$949 MXN
- Estilo Dibujo: 1→$649, 2→$799, 3→$949 MXN

---

## Funcionalidades Implementadas
- [x] Generación de arte IA con Replicate (FLUX 2 Pro)
- [x] Remoción de background (BiRefNet)
- [x] Preview canvas en tiempo real
- [x] Selector estilo: Icono / Dibujo
- [x] Contador de mascotas (1/2/3)
- [x] Textos superior/inferior personalizables
- [x] Trust badges + fecha entrega dinámica + social proof
- [x] Sticky CTA bar (aparece cuando el botón sale de viewport)
- [x] Doble CTA: "Ordenar ahora" (checkout directo) + "Ver mi tapete" (resumen)
- [x] Persistencia en localStorage
- [x] Fix: borrar foto también limpia localStorage (photoBase64)
- [x] Validación en-click con scroll al campo faltante
  - Botones siempre activos (solo blocked durante procesamiento IA)
  - Al click sin completar: borde rojo + mensaje de error bajo cada campo faltante
  - Scroll automático al primer error
  - Errores se limpian al corregir el campo (onChange)
  - Tarjeta del pet tiene borde rojo/fondo si tiene errores
- [x] Fix botón retry: solo aparece en fallo (no cuando generatedArtUrl existe)
- [x] Nombre de mascota ya no dice "(opcional)" — es campo requerido
- [x] Textos superior/inferior no son requeridos (usan defaults del canvas si vacíos)