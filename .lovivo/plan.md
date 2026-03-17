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
- **UGC Gallery REMOVED**: `PatapeteUGCGallery.tsx` still exists but is no longer rendered in IndexUI (removed redundancy).
- **Testimonials — 5 reviews**: PatapeteTestimonials.tsx shows 5 cards (María G., Rodrigo M., Sofía V., Carlos B., Valentina R./Salem). Grid: 1 col mobile → 2 col sm → 3 col lg → 5 col xl.
- **ProductSocialProof — 5 reviews**: Same 5 reviews as landing. Grid: 1 col → 2 col sm → 3 col lg → 5 col xl.
- **Review polish (latest)**:
  - Removed all "—" dashes from review texts (replaced with comma or "pero")
  - Corrected pet names in badge & text: Buddy, Rocco, Rocco+Buddy+Coco, Milo, Salem
  - Image height increased: Testimonials h-44→h-52, ProductSocialProof h-36→h-44
  - Strikethrough price in configurator (StepPets.tsx): ~~$1,199~~ $949 MXN + "Envío incluido"
- Copy cleanup: no "Usamos inteligencia artificial" → "nuestro sistema"

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

---

## 🔧 NEXT FEATURE: Transparent Overlay Header (Premium Nav)

### What the user wants
The header currently has a solid background even over the hero section, creating a visible visual break. User wants a premium feel where:
- The header floats transparently over the hero image (full-bleed effect)
- Nav links, logo, and icons appear in WHITE when transparent
- As the user scrolls, the header smoothly transitions to frosted glass (current solid state)
- This is the standard pattern used by premium brands (Allbirds, Shopify Dawn theme, etc.)

### Current state
- `PageTemplate.tsx` renders `<header className="sticky top-0 z-40 backdrop-blur-md ...">` — `sticky` means it occupies space in document flow, so hero starts BELOW it
- `EcommerceTemplate.tsx` already has `scrolled` state (triggers at 30px scroll)
- When NOT scrolled: `stickyHeaderClassName = 'bg-background/0 border-b border-transparent'` — transparent bg, but text is still dark (`text-foreground/60`)
- When scrolled: `stickyHeaderClassName = 'bg-background/90 ... border-b border-border/40 shadow-sm'`

### Implementation Steps

#### 1. `src/templates/PageTemplate.tsx`
Change `sticky` to `fixed` on the header element:
```
<header className={cn("fixed top-0 left-0 right-0 z-40 backdrop-blur-md transition-all duration-300", stickyHeaderClassName ?? "bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b border-border/50")}>
```
For non-full-width layouts, add top padding to the content area to account for fixed header:
```
<div className={cn("flex-1", layout !== 'full-width' && "pt-16 py-6")}>
```
(full-width pages like IndexUI don't need padding since the hero covers the full viewport)

#### 2. `src/templates/EcommerceTemplate.tsx`
Make nav links, logo area, and icons switch color based on `scrolled` state.

**Nav links**: 
- Not scrolled: `text-white/80 hover:text-white`
- Scrolled: `text-foreground/60 hover:text-foreground`

**Cart icon button**:
- Not scrolled: `text-white/80 hover:text-white`
- Scrolled: `text-foreground/70 hover:text-foreground`

**Profile menu area**: add `data-header-transparent={!scrolled}` or pass color via className

**CTA Button**: already has primary color, works on both backgrounds. Keep as is.

**Logo**: `BrandLogoLeft` — check if it supports a `className` or color prop. If not, wrap it and apply a CSS filter `brightness(0) invert(1)` when not scrolled (to make dark logo white), reverting when scrolled.

**Mobile hamburger**: Same color switching as cart icon.

**Mobile menu dropdown**: Always show with solid background (bg-background/95 backdrop-blur), regardless of scroll state. This is already the default when `mobileMenuOpen` is true.

#### 3. `src/components/BrandLogoLeft.tsx`
Check if logo is SVG-based or image. If it's an SVG with dark fill, it needs to invert when header is transparent. Options:
- Pass a `variant="light"` prop and conditionally apply `filter: invert(1)` or use white-colored SVG
- If it's a text-based logo, just change text color class

#### 4. Hero section adjustments (`src/components/patapete/PatapeteHero.tsx`)
The hero already has `min-height: 100svh` so with fixed header it will fill correctly from top of viewport.
The content is already pushed down with `py-16 md:py-32` but with the header overlapping, we may need to add `pt-20 md:pt-24` to account for fixed header height (~64-72px).
Actually, the hero content is center-aligned with `flex items-center`, so it should naturally center within 100svh. The background image should look fine since it already has `object-cover`.

Adjust hero content container:
- Add `pt-16` to the content `div.relative.z-10` to ensure text doesn't get hidden under fixed header on small screens

#### Files to modify:
- `src/templates/PageTemplate.tsx`: sticky → fixed, add pt-16 for non-full-width
- `src/templates/EcommerceTemplate.tsx`: conditional text colors based on scrolled state
- `src/components/BrandLogoLeft.tsx`: support light variant OR check implementation
- `src/components/patapete/PatapeteHero.tsx`: minor padding adjustment if needed

### Visual Result
- Hero image bleeds all the way to the top edge of the browser
- "Patapete" logo and nav links appear in white floating over the dark hero photo
- Subtle backdrop-blur and white text = ultra premium feel
- On scroll → smooth 300ms transition to frosted glass header (warm beige/white)
- Other pages (product page, etc.) have a top padding equal to header height so content isn't hidden

---

## Pending (next iteration)
- **Before/After slider**: Replace or improve PatapeteTransformation with drag slider (low-medium difficulty)
- **Demo configurador en landing**: Static 2-3 step animation showing the configurator flow (medium difficulty)

## Known Issues
- `checkout-update` and `meta-capi` edge functions fail in preview (env issue, not blocking)
- `PatapeteUGCGallery.tsx` file still exists but is unused — can be deleted if needed