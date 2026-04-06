# Patapete — Plan

## Current State
Ecommerce mexicano de tapetes personalizados con íconos de mascotas generados por IA. Stack: React/Vite/TS/Tailwind + Supabase custom backend.

## User Preferences
- Language: Spanish (Mexican)
- Keep it clean and simple, no overengineering
- CRO-first mindset

## Funnel Metrics (últimos 14 días, ~2026-04-06)
- Pageview → viewcontent: 463 → 440 (95%)
- viewcontent → photo_uploaded: 440 → 35 (**7.95% — bottleneck principal**)
- photo_uploaded → icon_generated: 35 → 35 (100% ✅)
- icon_generated → addtocart: 35 → 5 (14.29%)
- addtocart → initiatecheckout: 5 → 4 (80%)
- initiatecheckout → purchase: 4 → 0 (0% — posible problema técnico en checkout)

## Upload Rate por Segmento (últimos 14 días)
| Browser | OS | Referrer | Usuarios | Subieron | Tasa |
|---|---|---|---|---|---|
| Chrome | Android | m.facebook.com | 260 | 31 | 11.9% |
| Chrome | Android | l.facebook.com | 206 | 17 | 8.3% |
| Facebook Mobile | iOS | m.facebook.com | 132 | 12 | 9.1% |
| Mobile Safari | iOS | instagram.com | 66 | 8 | 12.1% |
| Chrome | Android | instagram.com | 60 | 7 | 11.7% |

**Conclusión**: El bug de Facebook Mobile WebView NO es generalizado. La sesión con 8 taps sin resultado fue un caso aislado. La tasa de upload baja (~8-12%) es UNIFORME en todos los segmentos → el problema es de UX/copy/motivación, no técnico.

## Recent Changes
- `StepPets.tsx`: "Uploader First" redesign
  - Título cambiado a "Sube la foto de tu mascota y ve tu tapete antes de comprar"
  - Subtítulo "Gratis. En ~20 segundos. Solo pídelo si te encanta." en muted
  - Botón grande de upload aparece justo después del título (solo cuando !hasAnyPhoto)
  - Botones "Ordenar ahora" y "Agregar al carrito" se ocultan hasta que hay foto subida
  - Stars + rating en una sola línea (sin flex-wrap)
- `StripePayment.tsx`: Banner SSL discreto con ícono candado + trust badges

## Known Issues
- Checkout abandonment muy rápido (< 30s) — posible bug en mobile/webview
- Sin métodos de pago mexicanos (OXXO/SPEI)
- Sin email capture para retargeting
- Después de generar ícono no hay nudge/celebración → usuarios se van sin comprar
- Upload rate baja y uniforme en todos los segmentos (~8-12%)

## Active Plan: Toast/Banner Celebratorio Post-Generación

### Priority 1: Banner/toast celebratorio después de icon_generated
**Files to modify**: `src/components/patapete/configurator/StepPets.tsx`

Cuando `icon_generated` sucede (pet.generatedArtUrl cambia de null a URL):
- Mostrar un floating banner muy visible por ~6 segundos (o hasta que el usuario haga scroll/tap)
- Diseño: fondo del color primario de la marca, texto blanco, emoji 🎉
- Texto: "¡Tu tapete quedó increíble! 🐾 → Ordénalo ahora"
- Botón dentro del banner que hace scroll suave al CTA de ordenar (o hace trigger del sticky CTA)
- Auto-dismiss después de 6s o al hacer tap en cualquier parte
- Solo mostrar 1 vez por sesión (guardar en sessionStorage: 'patapete_cta_shown')
- Trackear eventos PostHog: `post_generation_banner_shown` y `post_generation_banner_clicked`

Implementation details:
```tsx
// En StepPets.tsx — agregar estado:
const [showGenerationBanner, setShowGenerationBanner] = useState(false)
const generationBannerShown = useRef(false)

// useEffect watching pets array:
useEffect(() => {
  const hasGenerated = pets.some(p => p.generatedArtUrl)
  if (hasGenerated && !generationBannerShown.current) {
    const alreadyShown = sessionStorage.getItem('patapete_cta_shown')
    if (!alreadyShown) {
      generationBannerShown.current = true
      sessionStorage.setItem('patapete_cta_shown', '1')
      setShowGenerationBanner(true)
      // Track event
      // Auto-dismiss
      setTimeout(() => setShowGenerationBanner(false), 6000)
    }
  }
}, [pets])

// Banner UI: fixed bottom, above the sticky bar (z-50)
// Animate: slide up from bottom, slide down on dismiss
// Click handler: scroll to order button + setShowGenerationBanner(false)
```

Banner positioning:
- `fixed bottom-[72px]` (just above the sticky CTA bar if one exists, else `bottom-4`)
- Full width on mobile, max-w-sm centered on desktop
- Padding y-3 px-4
- Rounded-xl con shadow-lg
- Background: `bg-primary text-primary-foreground`
- Close button (X) en la esquina superior derecha
- Animación: `animate-slide-up` o translate-y transition

### Priority 2 (backlog): Mejorar gancho pre-upload
- Agregar una mini-galería de 2-3 ejemplos de tapetes generados ANTES del botón de upload
- "Así quedó el tapete de Ana con su perro 🐕" — foto real + tapete resultado
- Esto reduce la ansiedad de "¿cómo va a quedar?" antes de subir la foto
- Requiere tener fotos reales de clientes o ejemplos generados

### Priority 3 (backlog): Email capture post-generación
- Popup a los 2 min de haber generado sin comprar
- "Guarda tu diseño — te lo enviamos al correo"
- Requiere tabla en Supabase + edge function

## Próximos pasos (backlog)
1. ✅ Fix Facebook Mobile bug → DESCARTADO (no es generalizado, fue 1 sesión)
2. Toast/banner celebratorio post icon_generated → SIGUIENTE
3. Galería de ejemplos pre-upload para reducir ansiedad
4. Email capture: popup cuando generó ícono pero no compró en 2 min → "Guarda tu diseño"
5. OXXO/SPEI: Edge function con Stripe (posible desde Supabase conectado)
6. Validar checkout en mobile/webview Facebook (posible bug técnico)