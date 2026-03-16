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

## 🟡 Tarea pendiente: Validación con UX guiado + fix retry button

### Objetivo
1. Eliminar el botón "Reintentar generación con IA" cuando ya hay un retrato generado exitosamente
2. Reemplazar botones disabled por validación en-click con scroll al campo faltante

### Reglas de validación
- **Obligatorio por mascota (hasta petCount):** foto subida + nombre escrito
- **Opcional:** texto superior, texto inferior (si vacíos, usar placeholders como valor por defecto en el canvas)

### Cambios en `PhotoPetForm.tsx`

1. **Fix botón retry:** El `canRetry` ya tiene la lógica correcta (`!hasResult`), pero agregar también condición explícita: `!pet.generatedArtUrl`. Verificar que cuando `generatedArtUrl` es truthy el botón nunca aparezca.

2. **Nuevas props para mostrar errores:**
```tsx
interface PhotoPetFormProps {
  // ...existentes...
  photoError?: string   // mensaje bajo la zona de upload
  nameError?: string    // mensaje bajo el input de nombre
  petRef?: React.RefObject<HTMLDivElement>  // ref para scroll
}
```

3. **UI de error:**
- En la zona de upload (cuando no hay foto): añadir `border-destructive` si `photoError` y mostrar `<p className="text-xs text-destructive mt-1">{photoError}</p>`
- En el input de nombre: añadir `border-destructive` si `nameError` y mostrar mensaje similar

### Cambios en `StepPets.tsx`

1. **Quitar `disabled` de los botones CTA** — ya no se deshabilitan por validación

2. **Agregar estado de errores:**
```tsx
const [fieldErrors, setFieldErrors] = useState<{
  [petIndex: number]: { photo?: string; name?: string }
}>({})
```

3. **Agregar refs para scroll:**
```tsx
const petRefs = useRef<(HTMLDivElement | null)[]>([null, null, null])
```

4. **Función validateAndProceed:**
```tsx
function validateAndProceed(action: 'order' | 'continue') {
  if (isProcessing) return  // bloquear solo si está procesando IA
  
  const errors: typeof fieldErrors = {}
  let firstErrorIndex = -1
  
  for (let i = 0; i < petCount; i++) {
    const pet = pets[i]
    const hasPhoto = !!pet.photoFile || !!pet.photoBase64 || !!pet.generatedArtUrl
    const hasName = !!pet.name?.trim()
    
    if (!hasPhoto || !hasName) {
      errors[i] = {}
      if (!hasPhoto) errors[i].photo = 'Sube la foto de tu mascota para continuar'
      if (!hasName) errors[i].name = 'Escribe el nombre de tu mascota'
      if (firstErrorIndex === -1) firstErrorIndex = i
    }
  }
  
  if (Object.keys(errors).length > 0) {
    setFieldErrors(errors)
    // Scroll to first error
    if (firstErrorIndex >= 0 && petRefs.current[firstErrorIndex]) {
      petRefs.current[firstErrorIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    return
  }
  
  // Clear errors and proceed
  setFieldErrors({})
  if (action === 'order') onOrderNow()
  else onContinue()
}
```

5. **Wrappers en botones:**
- Botón "¡Ordenar ahora!": `onClick={() => validateAndProceed('order')}`
- Botón "Ver mi tapete": `onClick={() => validateAndProceed('continue')}`
- Sticky bar "Ordenar →": `onClick={() => validateAndProceed('order')}`
- Sticky bar "Ver tapete": `onClick={() => validateAndProceed('continue')}`

6. **Remover la validación vieja** (disabled + el párrafo "Sube la foto de X mascotas para continuar")
   - Quitar `disabled={!canContinue}` de los 4 botones
   - Quitar `{!allPhotosUploaded && <p>...Sube la foto...</p>}`
   - El `isProcessing` sí debe seguir bloqueando (no validar mientras genera IA)
   - Botones en procesando: disabled + label "Generando tu retrato..."

7. **Pasar refs y errores a PhotoPetForm:**
```tsx
{Array.from({ length: petCount }).map((_, i) => (
  <div key={i} ref={el => petRefs.current[i] = el} ...>
    <PhotoPetForm
      ...
      photoError={fieldErrors[i]?.photo}
      nameError={fieldErrors[i]?.name}
    />
  </div>
))}
```

8. **Limpiar error al interactuar:** En `onPetChange` dentro de StepPets, limpiar el error del pet correspondiente cuando cambia:
```tsx
// En la función que maneja cambios de mascota
// Si el user sube foto → limpiar fieldErrors[i].photo
// Si el user escribe nombre → limpiar fieldErrors[i].name
```
Esto se puede hacer pasando un wrapper de `onPetChange` en StepPets que limpia el error al recibir actualizaciones.

### Comportamiento del botón durante procesamiento IA
- Mientras `isProcessing === true`: botones disabled, label "Generando tu retrato..."
- Cuando termina (éxito o error): botones habilitados
- Si falló la generación: muestra retry, pero NO bloquea el botón de ordenar

### Textos default
Los textos superior/inferior ya se manejan como opcionales en el canvas. No requieren cambio. Si el user deja vacío, el canvas ya usa el placeholder visual. No se necesita lógica extra.

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
- [ ] Validación en-click con scroll al campo faltante
- [ ] Fix botón retry: solo en fallo, no en éxito