# Patapete Store — Plan

## Current State
E-commerce store for personalized pet mats (tapetes). Custom checkout with Stripe. Mobile-first refinements in progress.

## Recent Changes
- **Checkout mobile summary accordion**: Added Shopify-style collapsible order summary at the top of checkout, mobile-only (`md:hidden`). Shows "Resumen del pedido" + chevron + total. When expanded shows product images (w-16 h-16 object-contain with quantity badge), name, variant, price; plus subtotal, shipping, discount (if any), and total with MXN label.
- **MXN currency label**: Moved to inline left of price (small muted text), matching Shopify's style.
- **Checkout responsive fields**: Postal/City/State grid stacks on mobile, 3-col on desktop.
- **Credit card fields**: Number on its own row, expiry + CVC side by side on mobile.
- **Product images in checkout**: `object-contain` to avoid cropping portrait/vertical products.

## 🔧 PENDING FIX: Stripe Link button missing on mobile

### Root Cause
Too much nested padding makes the card number field ~220px wide on mobile. Stripe requires ~300px+ to render the Link autofill button.

Padding stack on mobile (375px viewport):
- Page: `px-4` = 16px each side → 32px
- Form wrapper: `p-6` = 24px each side → 48px  
- Inner `<Card>` → `<CardContent className="p-6">` = 24px each side → 48px + 2px border
- Field wrapper: `p-3` = 12px each side → 24px
- **Total left for input: ~221px** — too narrow for Stripe Link

### Fix

**File: `src/components/StripePayment.tsx`**
- Replace `<Card>` + `<CardContent className="p-6">` with a plain `<div className="border rounded-lg p-4 sm:p-6 bg-card overflow-visible">`
  - This removes the extra nesting, reduces mobile padding, and ensures no overflow clipping

**File: `src/pages/ui/CheckoutUI.tsx`**
- Change form wrapper: `<div className="space-y-8 bg-card p-4 sm:p-6 rounded-lg">` (was `p-6`)
  - Reduces form wrapper padding on mobile from 24px to 16px each side

After fix, card number field width on 375px:
- 375 - 32 (page) - 32 (form) - 32 (stripe card div) - 24 (field p-3) = ~255px
- Still needs to verify but significantly better, and removing overflow hidden from Card should help Stripe render the Link overlay correctly

### Note
The `Card` component (`rounded-lg border`) doesn't explicitly set `overflow: hidden`, but the combination of `rounded-lg` with inner iframes can cause browser-level overflow clipping. Using a plain `div` with `overflow: visible` eliminates this.

## User Preferences
- Checkout should match Shopify UX best practices for mobile.
- Clean, functional mobile checkout is priority.
- Prefer CSS solutions (truncation, object-fit) over JS workarounds.
- No hardcoded mock data.

## Known Issues
- Multiple GoTrueClient instances warning (non-critical, pre-existing).
- Meta Pixel non-standard events warning (non-critical, pre-existing).