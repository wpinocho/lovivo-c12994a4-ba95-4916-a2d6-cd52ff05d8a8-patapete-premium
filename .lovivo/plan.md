# Patapete Store — Plan

## Current State
E-commerce store for personalized pet mats (tapetes). Custom checkout with Stripe. Mobile-first refinements in progress.

## Recent Changes
- **Checkout mobile summary accordion**: Added Shopify-style collapsible order summary at the top of checkout, mobile-only (`md:hidden`). Shows "Resumen del pedido" + chevron + total. When expanded shows product images (w-16 h-16 object-contain with quantity badge), name, variant, price; plus subtotal, shipping, discount (if any), and total with MXN label.
- **MXN currency label**: Moved to inline left of price (small muted text), matching Shopify's style.
- **Checkout responsive fields**: Postal/City/State grid stacks on mobile, 3-col on desktop.
- **Credit card fields**: Number on its own row, expiry + CVC side by side on mobile.
- **Product images in checkout**: `object-contain` to avoid cropping portrait/vertical products.

## User Preferences
- Checkout should match Shopify UX best practices for mobile.
- Clean, functional mobile checkout is priority.
- Prefer CSS solutions (truncation, object-fit) over JS workarounds.
- No hardcoded mock data.

## Known Issues
- Multiple GoTrueClient instances warning (non-critical, pre-existing).
- Meta Pixel non-standard events warning (non-critical, pre-existing).