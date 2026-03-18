# Patapete Store - Plan

## Current State
Production store with a custom mat configurator (canvas-based, interactive). Performance optimizations done.

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

## Known Issues
- None currently active

## User Preferences
- Spanish language responses
- Store: patapete.com
- Product: custom coconut fiber mats with pet illustrations