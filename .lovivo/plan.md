# Patapete Store — Plan

## Current State
React/TS storefront for Patapete (custom pet portrait doormats, Mexico).
All UI lives in `src/components/patapete/` and `src/pages/ui/IndexUI.tsx`.

## Recent Changes
- **Hero price anchor**: Added `~~$1,199~~ Desde $949 MXN · Envío incluido` below CTA buttons in PatapeteHero.tsx
- **Product page urgency**: Added amber pill badge "Hacemos pocos pedidos por semana para mantener la calidad" in StepPets.tsx below delivery info
- **Gift section**: Created `PatapeteGiftSection.tsx` with 4 occasion cards (Día de Madres, Navidad, Cumpleaños, Sin ocasión). Inserted between PatapeteBenefits and PatapetePersonalization in IndexUI.tsx
- **Nav menu revamp**: Removed "El arte IA", added "Reseñas" (→ #testimonios). Links: ¿Cómo funciona? / Galería / Reseñas. CTA now has Wand2 icon + shadow-primary hover lift.
- **Glass header effect**: Header transitions from transparent to bg-background/90 + shadow-sm on scroll.
- **Mobile trust strip slider**: Auto-slides phrases every 2s with CSS slide animation (md:hidden). Desktop marquee unchanged.
- **WhatsApp**: Updated to real WhatsApp icon and number +52 55 31 21 53 86
- **UGC Gallery**: Created `PatapeteUGCGallery.tsx` with 5 real customer photos (Rocco, 3 dogs, Salem cat, Buddy golden, Milo dachshund). Inserted after PatapeteTestimonials in IndexUI.tsx.
- **Testimonials with real photos**: Updated PatapeteTestimonials.tsx to show tapete photo thumbnails at the top of each card (matching breed to story).
- **ProductSocialProof with real photos**: All 3 mini reviews now have real customer tapete photos (Buddy unboxing, Salem cat, Milo dachshund).
- Copy cleanup: no "Usamos inteligencia artificial" → "nuestro sistema"

## UGC Photo URLs (Supabase Storage)
- Rocco (pastor alemán + tapete en cocina): `...1773768438251-79davb2huk.webp`
- 3 perros (Rocco, Buddy, Coco): `...1773768438251-kqrq9bnc2q7.webp`
- Salem (gato negro + tapete): `...1773768438251-xrdo9mrysk.webp`
- Buddy (golden unboxing): `...1773768438251-il55q3miib.webp`
- Milo (dachshund closeup): `...1773768438251-b6cszct9tu8.webp`

Base: `https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/`

## User Preferences
- Store language: Spanish (Mexico)
- Brand: warm, premium, artisan feel
- No AI-related copy visible to end user — focus on "retrato artístico", not "IA"
- CTAs always link to `/productos/tapete-personalizado-patapete`
- Urgency: artisan/scarcity-based, NOT fake timers

## Pending (next iteration)
- **Before/After slider**: Replace or improve PatapeteTransformation with drag slider (low-medium difficulty)
- **Demo configurador en landing**: Static 2-3 step animation showing the configurator flow (medium difficulty)

## Known Issues
- `checkout-update` and `meta-capi` edge functions fail in preview (env issue, not blocking)