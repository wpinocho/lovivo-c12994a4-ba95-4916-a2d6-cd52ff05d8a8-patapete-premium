import { useState, useEffect, useMemo } from 'react'
import { Gift, Check, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import type { PriceRule, BogoConditions, Product } from '@/lib/supabase'
import { STORE_ID } from '@/lib/config'
import { useSettings } from '@/contexts/SettingsContext'

interface BOGOGiftBannerProps {
  cartItems: { type: string; product?: Product; quantity: number; key: string }[]
  bogoRules: PriceRule[]
  onAddGift: (product: Product, variant?: import('@/lib/supabase').ProductVariant) => void
  isProductInCart: (productId: string) => boolean
}

interface GiftMatch {
  rule: PriceRule
  giftProductIds: string[]
  triggerProductId: string
}

export const BOGOGiftBanner = ({ cartItems, bogoRules, onAddGift, isProductInCart }: BOGOGiftBannerProps) => {
  const [giftProducts, setGiftProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const { formatMoney } = useSettings()

  // Find which BOGO different_products rules are triggered by cart items
  const giftMatches = useMemo<GiftMatch[]>(() => {
    const matches: GiftMatch[] = []
    for (const rule of bogoRules) {
      const cond = rule.conditions as BogoConditions | undefined
      if (!cond || cond.bogo_mode !== 'different_products') continue
      if (!cond.get_product_ids?.length) continue

      // Check if any cart product triggers this rule
      for (const item of cartItems) {
        if (item.type !== 'product' || !item.product) continue
        // Check if this product is in the rule's product_ids or applies_to all
        const productId = item.product.id
        const applies =
          rule.applies_to === 'all' ||
          (rule.applies_to === 'specific_products' && rule.product_ids?.includes(productId))

        if (applies && item.quantity >= cond.buy_quantity) {
          matches.push({
            rule,
            giftProductIds: cond.get_product_ids,
            triggerProductId: productId,
          })
          break // one trigger per rule is enough
        }
      }
    }
    return matches
  }, [cartItems, bogoRules])

  // Fetch gift products
  useEffect(() => {
    const allGiftIds = [...new Set(giftMatches.flatMap(m => m.giftProductIds))]
    if (allGiftIds.length === 0) {
      setGiftProducts([])
      return
    }

    let cancelled = false
    setLoading(true)

    supabase
      .from('products')
      .select('id, title, slug, price, compare_at_price, images, image_metadata, status, store_id, variants')
      .eq('store_id', STORE_ID)
      .in('id', allGiftIds)
      .then(({ data }) => {
        if (!cancelled) {
          setGiftProducts((data as Product[]) || [])
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [giftMatches])

  if (giftMatches.length === 0 || loading) return null
  if (giftProducts.length === 0) return null

  return (
    <div className="rounded-md border border-accent bg-accent/10 p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-sm font-medium text-accent-foreground">
        <Gift className="h-4 w-4" />
        <span>¡Tienes un regalo!</span>
      </div>
      {giftProducts.map((product) => {
        const alreadyInCart = isProductInCart(product.id) || cartItems.some(i => i.key === `bogo-gift:${product.id}`)
        return (
          <div key={product.id} className="flex items-center gap-3">
            <div className="w-12 h-12 rounded bg-muted overflow-hidden flex-shrink-0">
              {product.images?.[0] ? (
                <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Gift className="h-4 w-4" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground line-clamp-1">{product.title}</p>
              <p className="text-xs font-semibold text-accent-foreground">GRATIS</p>
            </div>
            {alreadyInCart ? (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Agregado
              </span>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 h-8 text-xs"
                onClick={() => {
                  // Pick cheapest variant if product has variants
                  const cheapestVariant = product.variants?.length
                    ? [...product.variants].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))[0]
                    : undefined
                  onAddGift(product, cheapestVariant)
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Agregar
              </Button>
            )}
          </div>
        )
      })}
    </div>
  )
}
