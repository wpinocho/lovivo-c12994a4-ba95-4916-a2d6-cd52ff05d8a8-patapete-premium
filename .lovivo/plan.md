# Patapete - Plan de Implementación

## Estado actual (Marzo 2026)

### ✅ Completado
- Configurador visual completo (estilos: icono, dibujo; 1-3 mascotas; frases; nombres)
- Edge function `generate-tattoo` → llama a Replicate (BiRefNet + FLUX Dev)
- Edge function `upload-patapete-preview` → guarda canvas PNG en bucket `pet-tattoos/cart-previews/`
- Persistencia en localStorage (STORAGE_KEY='patapete_v1') con filtro de URLs expiradas
- Preview en CartSidebar con thumbnail del tapete personalizado
- Canvas preview con `CanvasPreview.tsx` (CSS layout, mismo origen, no canvas-based)
- `compositeRug` en `canvasCompositing.ts` para generar JPG de preview para carrito
- Sticky CTA bar + trust badges + "¿Qué pasa después?" section

### 🏗️ Arquitectura de Imágenes (MUY IMPORTANTE)

#### Problema resuelto: message-images vs repo
- `message-images` bucket (Lovivo): se purga/expira → NUNCA usar para assets permanentes
- Solución: assets estáticos en `public/` del repo (mismo origen, nunca expiran, sin CORS)

#### Assets en el repo (public/)
- `/tapete-mockup.webp` — foto del tapete coir/jute con entrada a casa
- `/demos/icono-0.webp` — demo terrier (estilo icono, coloreado)
- `/demos/icono-1.webp` — demo chihuahua (estilo icono, coloreado)
- `/demos/icono-2.webp` — demo bulldog (estilo icono, coloreado)
- `/demos/dibujo-0.webp` — demo terrier (estilo dibujo, líneas negras)
- `/demos/dibujo-1.webp` — demo chihuahua (estilo dibujo, líneas negras)
- `/demos/dibujo-2.webp` — demo bulldog/frenchie (estilo dibujo, líneas negras)

#### Generated art URLs (permanentes)
- Bucket: `pet-tattoos` en el Supabase del USUARIO (no Lovivo)
- Carpeta: `pet-tattoos/finals/` para arte generado
- Carpeta: `pet-tattoos/cart-previews/` para PNG del canvas al agregar al carrito
- El bucket es PUBLIC con 3 políticas
- PatapeteConfigurator filtra URLs de `message-images` al cargar localStorage

### 🔧 Arquitectura de 2 Supabase

1. **Lovivo Platform** (compartido, multitenant)
   - `src/lib/supabase.ts` + `src/lib/edge.ts`
   - Para: products, collections, checkout, orders, payments
   - ❌ NO modificar, ❌ NO usar para edge functions custom

2. **Supabase del Usuario** (proyecto propio)
   - `src/integrations/supabase/client.ts` → `userSupabase`
   - Bucket `pet-tattoos` (public): arte generado + previews de carrito
   - Edge functions: `generate-tattoo`, `upload-patapete-preview`
   - ✅ USAR para todo lo custom de Patapete

### 📁 Archivos clave del configurador
```
src/components/patapete/configurator/
├── PatapeteConfigurator.tsx  ← Estado global, localStorage, generación IA
├── StepPets.tsx              ← UI principal: subida foto, CTA, trust signals
├── PhotoPetForm.tsx          ← Zona de upload, preview, onError fallback
├── CanvasPreview.tsx         ← Preview visual CSS del tapete (no canvas)
├── types.ts                  ← Pet, Style, ConfiguratorState interfaces
└── StepStyle.tsx             ← Selector de estilo (icono/dibujo)

src/utils/
├── canvasCompositing.ts      ← compositeRug(): genera JPG para carrito
├── imagePreprocessing.ts     ← removeWhiteBackground() + compressAndResizeImage()
└── replicateApi.ts           ← generateTattooArt() → llama a generate-tattoo edge fn

supabase/functions/
├── generate-tattoo/          ← BiRefNet bg removal + FLUX Dev → guarda en pet-tattoos/finals/
└── upload-patapete-preview/  ← Sube PNG del canvas a pet-tattoos/cart-previews/
```

### 🐛 Bugs resueltos
- URLs de `message-images` expiran → demo images + tapete ahora en `public/` del repo
- `generatedArtUrl` de `message-images` en localStorage → filtrado en `loadFromStorage()`
- Imagen rota en pet slot → `onError` en `PhotoPetForm.tsx` limpia `generatedArtUrl` null

## Tareas pendientes
- [ ] Verificar que el tapete mockup (`/tapete-mockup.webp`) está correctamente en el repo
- [ ] Verificar flow completo: subir foto → generar arte → agregar carrito → checkout