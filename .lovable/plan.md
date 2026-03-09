

# Plan: Fix BOGO gift checkout integration

## Issues Found

1. **Gift product sent without variant_id** -- The gift product "Selva Tropical" has mandatory variants (Mini/Full Size), but `BOGOGiftBanner` adds it via `addItem(product)` without a variant. When `cartToApiItems` converts this to checkout format, it sends `{ product_id: "...", quantity: 1 }` without `variant_id`. The backend requires `variant_id` for products with variants, which will cause checkout to fail.

2. **Gift not auto-removed when trigger product is removed** -- If the user removes the "buy" product (Aloe & Maguey) from the cart, the gift (Selva Tropical) stays in the cart with $0 price, orphaned.

3. **Gift quantity can be incremented** -- If the user somehow re-triggers addItem, the gift quantity goes to 2, but `max_uses_per_order` is 1.

4. **Backend handles BOGO discount server-side** -- The backend automatically detects BOGO rules and applies discounts to the cheapest GET items. So the frontend should send the gift as a normal item (correct already). The local $0 display is just a preview; the real discount comes from `applied_rules` in the checkout response.

## Changes

### 1. `src/components/ui/BOGOGiftBanner.tsx` -- Include variants in gift fetch, pick cheapest variant

- Add `variants` to the product select query
- When calling `onAddGift`, pass the cheapest variant along with the product
- Update the `onAddGift` callback type to accept an optional variant

### 2. `src/components/CartSidebar.tsx` -- Pass variant in onAddGift, auto-remove orphaned gifts

- Update `onAddGift` callback: `addItem(product, variant, undefined, true)`
- Add an effect or memo that detects when a BOGO trigger product is removed but its gift remains, and auto-removes the gift

### 3. `src/pages/ui/CartUI.tsx` -- Same: pass variant in onAddGift, update interface

- Update `onAddGift` in BOGOGiftBanner to pass variant
- Update CartUIProps to accept the auto-removal logic from adapter

### 4. `src/adapters/CartAdapter.tsx` -- Add auto-removal logic for orphaned gifts

- After computing bogoRules, check if any `bogo-gift:*` items in cart no longer have their trigger product present. If so, auto-remove them.

### 5. `src/contexts/CartContext.tsx` -- Prevent gift quantity > 1

- In the `ADD_ITEM` reducer case, when `isBogoGift` is true and the item already exists, do NOT increment quantity (return state unchanged).

| File | Change |
|------|--------|
| `src/components/ui/BOGOGiftBanner.tsx` | Fetch variants, pass cheapest variant to onAddGift |
| `src/contexts/CartContext.tsx` | Prevent gift quantity increment beyond 1 |
| `src/adapters/CartAdapter.tsx` | Auto-remove orphaned gift items |
| `src/components/CartSidebar.tsx` | Pass variant in onAddGift, wire auto-removal |
| `src/pages/ui/CartUI.tsx` | Pass variant in onAddGift |

