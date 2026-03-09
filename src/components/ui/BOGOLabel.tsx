import { usePriceRules } from '@/hooks/usePriceRules'
import type { BogoConditions } from '@/lib/supabase'
import { Gift } from 'lucide-react'

interface BOGOLabelProps {
  productId: string
  collectionIds?: string[]
}

export const BOGOLabel = ({ productId, collectionIds }: BOGOLabelProps) => {
  const { getBogoRulesForProduct } = usePriceRules()

  const rules = getBogoRulesForProduct(productId, collectionIds)
  if (rules.length === 0) return null

  const rule = rules[0]
  const conditions = rule.conditions as BogoConditions | undefined
  if (!conditions) return null

  const { buy_quantity, get_quantity, get_discount_percentage, bogo_mode } = conditions

  let label: string
  if (bogo_mode === 'different_products') {
    if (get_discount_percentage === 100) {
      label = `Compra ${buy_quantity} y lleva un regalo gratis`
    } else {
      label = `Compra ${buy_quantity} y lleva otro al ${get_discount_percentage}% OFF`
    }
  } else {
    // same_product
    if (get_discount_percentage === 100) {
      label = `Lleva ${buy_quantity + get_quantity}, paga ${buy_quantity}`
    } else {
      label = `Compra ${buy_quantity}, lleva ${get_quantity} al ${get_discount_percentage}% OFF`
    }
  }

  return (
    <span className="bg-accent text-accent-foreground text-xs px-2 py-1 rounded-sm font-medium inline-flex items-center gap-1">
      {bogo_mode === 'different_products' && <Gift className="h-3 w-3" />}
      {label}
    </span>
  )
}
