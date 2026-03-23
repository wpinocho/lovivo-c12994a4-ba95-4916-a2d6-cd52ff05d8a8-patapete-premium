# Patapete Store - Plan

## Current State
Production store with a custom mat configurator (canvas-based, interactive). Performance optimizations done. Meta Ads campaign running.

## Recent Changes
- **ThankYou blank screen fix (deploy issue)**: `ThankYou` was lazy-loaded. After a new deploy, the old chunk hash (`ThankYou-B_tmIxxu.js`) no longer exists, causing a MIME type error and blank page. Fixed by:
  1. Importing `ThankYou` statically (direct import, not lazy) — critical post-purchase page
  2. Added `lazyWithReload` helper for all other lazy pages: on chunk load failure, auto-reloads once (with `sessionStorage` guard to prevent infinite loop)
- **ThankYou "Pedido no encontrado" fix**: `StripePayment.tsx` had an empty block where order data was supposed to be saved to localStorage. Fixed by building and saving `completed_order` to localStorage after successful payment, including:
  - Order number (last 8 chars of orderId, uppercased)
  - Total amount, currency, shipping/billing addresses
  - Order items with product name, variant name, price, quantity
  - **Patapete preview image**: reads from `patapete_customization:${itemKey}` in localStorage before ThankYou clears them
- **Pet icon flash fix**: FLUX-generated icons (e.g. cat) were showing white background for ~1s on reload while flood-fill processed. Fixed by not rendering the image until flood-fill completes.
- **Performance optimizations**: tapete-mockup reduced 318KB→37KB, logo reduced 27.6KB→4.9KB, crossorigin fix to prevent double download. Saved ~600KB/visit.
- **FloatingCart removed**: The floating cart button was overlapping the WhatsApp button. Removed it from EcommerceTemplate.
- **Configurator tracking events added**: Added 4 new tracking events to map the full conversion funnel:
  - `photo_uploaded` (in PhotoPetForm.tsx) — fires when user uploads a pet photo, with `pet_index`, `file_type`, `source` (file_input | drag_and_drop)
  - `icon_generated` (in PatapeteConfigurator.tsx) — fires when AI art finishes generating, with `pet_index`, `style`, `pet_name`
  - `configurator_add_to_cart` (in PatapeteConfigurator.tsx) — fires on "Agregar al carrito" click
  - `configurator_order_now` (in PatapeteConfigurator.tsx) — fires on "Ordenar ahora" click

## Known Issues / Active Investigation
- **🔴 CRITICAL: Mobile traffic from Meta converts at 0%**
  - 150 mobile `viewcontent` events → 0 mobile `initiatecheckout` → 0 mobile purchases
  - All 31 initiatecheckout and 2 purchases were from Desktop (likely internal traffic from lovivo.app)
  - Meta Ads send ~142 mobile sessions to the product page but NONE convert
  - Hypothesis: configurator UX on mobile is broken or the 20-second AI wait kills mobile users
  - **Next step**: After running with new events for a few days, check `photo_uploaded` rates on mobile vs desktop to diagnose

## User Preferences
- Spanish language responses
- Store: patapete.com
- Product: custom coconut fiber mats with pet illustrations

---

## 🔧 Pending Fix: PostHog AddToCart Event Name

### Problem
In `src/lib/tracking-utils.ts`, the `trackHybrid` method sends events to PostHog using:
```js
posthog.capture(eventName.toLowerCase(), { ...customData, event_id: eventId });
```
This converts `AddToCart` → `addtocart` (all lowercase, no separators). In PostHog this shows up as an unreadable event name and doesn't follow the expected snake_case convention.

Same issue affects all tracked events:
- `AddToCart` → `addtocart` ❌ (should be `add_to_cart`)
- `ViewContent` → `viewcontent` ❌ (should be `view_content`)
- `InitiateCheckout` → `initiatecheckout` ❌ (should be `initiate_checkout`)
- `Purchase` → `purchase` ✅ (already fine)
- `Search` → `search` ✅ (already fine)

### Fix
In `src/lib/tracking-utils.ts`, add a helper method that converts PascalCase/CamelCase event names to snake_case for PostHog:

```ts
private toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
}
```

Then in `trackHybrid`, replace:
```js
posthog.capture(eventName.toLowerCase(), { ... });
```
with:
```js
posthog.capture(this.toSnakeCase(eventName), { ... });
```

### Files to modify
- `src/lib/tracking-utils.ts`: Add `toSnakeCase` helper, update `trackHybrid` to use it for PostHog captures.