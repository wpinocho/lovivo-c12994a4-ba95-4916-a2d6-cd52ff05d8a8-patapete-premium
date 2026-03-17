# Patapete Store — Plan

## Current State
React/TS storefront for Patapete (custom pet portrait doormats, Mexico).
All UI lives in `src/components/patapete/` and `src/pages/ui/IndexUI.tsx`.

## Recent Changes
- **Nav menu revamp**: Removed "El arte IA", added "Reseñas" (→ #testimonios). Links: ¿Cómo funciona? / Galería / Reseñas. CTA now has Wand2 icon + shadow-primary hover lift.
- **Glass header effect**: Header transitions from transparent to bg-background/90 + shadow-sm on scroll. PageTemplate now accepts `stickyHeaderClassName` prop.
- **Mobile trust strip slider**: Auto-slides phrases every 2s with CSS slide animation (md:hidden). Desktop marquee unchanged.
- **PatapeteTransformation image**: Updated to user-provided product texture close-up.
- Copy cleanup: no "· Retrato IA" labels in gallery, "Retrato único" in transformation, etc.

## User Preferences
- Store language: Spanish (Mexico)
- Brand: warm, premium, artisan feel
- No AI-related copy visible to end user — focus on "retrato artístico", not "IA"
- CTAs always link to `/productos/tapete-personalizado-patapete`

## Known Issues
- `checkout-update` and `meta-capi` edge functions fail in preview (env issue, not blocking)