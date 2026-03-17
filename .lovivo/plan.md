# Patapete Store — Plan

## Current State
React/TS storefront for Patapete (custom pet portrait doormats, Mexico).
All UI lives in `src/components/patapete/` and `src/pages/ui/IndexUI.tsx`.

## Recent Changes
- **Hero price anchor**: Added `~~$1,199~~ Desde $949 MXN · Envío incluido` below CTA buttons in PatapeteHero.tsx
- **Product page urgency**: Added amber pill badge "Hacemos pocos pedidos por semana para mantener la calidad" in StepPets.tsx below delivery info
- **Gift section**: Created `PatapeteGiftSection.tsx` with 4 occasion cards. Inserted between PatapeteBenefits and PatapetePersonalization in IndexUI.tsx
- **Nav menu revamp**: Removed "El arte IA", added "Reseñas" (→ #testimonios). CTA has Wand2 icon + shadow-primary hover lift.
- **Glass header effect**: Header transitions from transparent to bg-background/90 + shadow-sm on scroll.
- **Mobile trust strip slider**: Auto-slides phrases every 2s with CSS slide animation (md:hidden).
- **WhatsApp**: Real WhatsApp icon and number +52 55 31 21 53 86
- **UGC Gallery REMOVED**: `PatapeteUGCGallery.tsx` still exists but is unused — can be deleted if needed.
- **Testimonials — 5 reviews**: PatapeteTestimonials.tsx shows 5 cards (María G., Rodrigo M., Sofía V., Carlos B., Valentina R./Salem). Grid: 1 col mobile → 2 col sm → 3 col lg → 5 col xl.
- **ProductSocialProof — 5 reviews**: Same 5 reviews as landing. Grid: 1 col → 2 col sm → 3 col lg → 5 col xl.
- **Review polish (latest)**:
  - Removed all "—" dashes from review texts
  - Corrected pet names in badge & text: Buddy, Rocco, Rocco+Buddy+Coco, Milo, Salem
  - Image height increased: Testimonials h-44→h-52, ProductSocialProof h-36→h-44
  - Strikethrough price in configurator (StepPets.tsx): ~~$1,199~~ $949 MXN + "Envío incluido"
- **✅ Transparent overlay header (DONE)**:
  - `PageTemplate.tsx`: header changed from `sticky` to `fixed top-0 left-0 right-0`. Non-full-width layouts get `pt-20` to offset fixed header.
  - `EcommerceTemplate.tsx`: added `transparentOnTop` prop (default `false`). When `true`, the `scrolled` state starts at `false` and reacts to scroll. Nav links, cart, hamburger, profile icons all switch between white (transparent) and foreground (scrolled) colors.
  - `BrandLogoLeft.tsx`: added `transparent` prop — when true, applies `brightness(0) invert(1)` filter + white text.
  - `ProfileMenu.tsx`: added `className` prop so EcommerceTemplate can pass color class.
  - `IndexUI.tsx`: passes `transparentOnTop={true}` to EcommerceTemplate. All other pages default to solid header.

## UGC Photo URLs (Supabase Storage)
Base: `https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/`
- Rocco (pastor alemán + tapete en cocina): `...1773768438251-79davb2huk.webp` → Rodrigo M. review
- 3 perros (Rocco, Buddy, Coco): `...1773768438251-kqrq9bnc2q7.webp` → Sofía V. review
- Salem (gato negro + tapete "Prepara tu soborno en atún"): `...1773769457469-5us0oicamfm.webp` → Valentina R. review
- Buddy (golden unboxing): `...1773768438251-il55q3miib.webp` → María G. review
- Milo (dachshund closeup): `...1773768438251-b6cszct9tu8.webp` → Carlos B. review

## User Preferences
- Store language: Spanish (Mexico)
- Brand: warm, premium, artisan feel
- No AI-related copy visible to end user — focus on "retrato artístico", not "IA"
- CTAs always link to `/productos/tapete-personalizado-patapete`
- Urgency: artisan/scarcity-based, NOT fake timers
- Consistency: same reviews/photos in landing AND product page (no duplicate content with different text)

## Pending (next iteration)
- **Before/After slider**: Replace or improve PatapeteTransformation with drag slider (low-medium difficulty)
- **Demo configurador en landing**: Static 2-3 step animation showing the configurator flow (medium difficulty)

## Known Issues
- `checkout-update` and `meta-capi` edge functions fail in preview (env issue, not blocking)
- `PatapeteUGCGallery.tsx` file still exists but is unused — can be deleted if needed