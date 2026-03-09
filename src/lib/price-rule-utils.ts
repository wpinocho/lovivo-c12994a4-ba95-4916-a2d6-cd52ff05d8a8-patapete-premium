import type { PriceRule, BogoConditions } from '@/lib/supabase'

export interface VolumeDiscountResult {
  discountedPrice: number
  originalPrice: number
  savingsLabel: string
}

/**
 * Calcula el descuento de volumen aplicable para un producto dado su precio base,
 * cantidad en el carrito y las reglas de volumen que le aplican.
 * Retorna null si no aplica ningún descuento.
 */
export function calcVolumeDiscount(
  basePrice: number,
  quantity: number,
  volumeRules: PriceRule[]
): VolumeDiscountResult | null {
  if (!volumeRules.length || quantity < 1) return null

  let bestDiscount: VolumeDiscountResult | null = null
  let bestSavings = 0

  for (const rule of volumeRules) {
    const conditions = rule.conditions as any
    if (!conditions?.tiers?.length) continue

    const discountType = conditions.discount_type || 'percentage'
    const tierMode = conditions.tier_mode || 'flat'
    const sortedTiers = (conditions.tiers as any[])
      .slice()
      .sort((a: any, b: any) => (a.min_quantity || 0) - (b.min_quantity || 0))

    if (tierMode === 'graduated') {
      // Graduated: each unit gets the discount of its tier bracket
      let totalCost = 0
      let maxDiscountValue = 0

      for (let u = 1; u <= quantity; u++) {
        // Find the highest tier where u >= min_quantity
        let tierForUnit: any = null
        for (const t of sortedTiers) {
          if (u >= (t.min_quantity || 0)) tierForUnit = t
        }

        if (tierForUnit) {
          const dv = tierForUnit.discount_value || 0
          if (dv > maxDiscountValue) maxDiscountValue = dv
          if (discountType === 'percentage') {
            totalCost += basePrice * (1 - dv / 100)
          } else {
            totalCost += Math.max(0, basePrice - dv)
          }
        } else {
          totalCost += basePrice
        }
      }

      const avgUnitPrice = totalCost / quantity
      const savings = basePrice * quantity - totalCost
      if (savings > bestSavings) {
        bestSavings = savings
        const label = discountType === 'percentage'
          ? `hasta ${maxDiscountValue}% OFF`
          : `-$${maxDiscountValue}`
        bestDiscount = {
          discountedPrice: avgUnitPrice,
          originalPrice: basePrice,
          savingsLabel: label,
        }
      }
    } else {
      // Flat: single tier applies to all units
      const applicableTiers = sortedTiers
        .filter((t: any) => quantity >= (t.min_quantity || 0))
        .sort((a: any, b: any) => (b.min_quantity || 0) - (a.min_quantity || 0))

      const tier = applicableTiers[0]
      if (!tier) continue

      const discountValue = tier.discount_value || 0
      let discountedPrice: number
      let label: string

      if (discountType === 'percentage') {
        discountedPrice = basePrice * (1 - discountValue / 100)
        label = `${discountValue}% OFF`
      } else {
        discountedPrice = Math.max(0, basePrice - discountValue)
        label = `-$${discountValue}`
      }

      const savings = (basePrice - discountedPrice) * quantity
      if (savings > bestSavings) {
        bestSavings = savings
        bestDiscount = {
          discountedPrice,
          originalPrice: basePrice,
          savingsLabel: label,
        }
      }
    }
  }

  return bestDiscount
}

/**
 * Calcula el descuento BOGO para same_product.
 * Retorna el precio unitario promedio considerando unidades gratis.
 */
export interface BogoDiscountResult {
  discountedPrice: number
  originalPrice: number
  savingsLabel: string
}

export function calcBogoDiscount(
  basePrice: number,
  quantity: number,
  bogoRules: PriceRule[]
): BogoDiscountResult | null {
  if (!bogoRules.length || quantity < 1) return null

  for (const rule of bogoRules) {
    const cond = rule.conditions as BogoConditions | undefined
    if (!cond || cond.bogo_mode !== 'same_product') continue

    const { buy_quantity, get_quantity, get_discount_percentage } = cond
    const groupSize = buy_quantity + get_quantity
    if (quantity < groupSize) continue

    // How many full groups + remainder
    const fullGroups = Math.floor(quantity / groupSize)
    const remainder = quantity % groupSize

    // Cost per group: buy_quantity at full price + get_quantity at discounted price
    const discountFraction = get_discount_percentage / 100
    const costPerGroup = (buy_quantity * basePrice) + (get_quantity * basePrice * (1 - discountFraction))
    const totalCost = (fullGroups * costPerGroup) + (remainder * basePrice)
    const avgPrice = totalCost / quantity

    if (avgPrice < basePrice) {
      const label = get_discount_percentage === 100
        ? `${buy_quantity}x${buy_quantity + get_quantity} aplicado`
        : `BOGO ${get_discount_percentage}% OFF`
      return {
        discountedPrice: avgPrice,
        originalPrice: basePrice,
        savingsLabel: label,
      }
    }
  }

  return null
}

/**
 * Calcula el precio unitario de un item del carrito considerando suscripción + volumen + BOGO.
 */
export function calcItemUnitPrice(
  basePrice: number,
  quantity: number,
  volumeRules: PriceRule[],
  sellingPlan?: any,
  calcSubscriptionPriceFn?: (price: number, plan: any) => number,
  bogoRules?: PriceRule[]
): { unitPrice: number; volumeDiscount: VolumeDiscountResult | null; bogoDiscount: BogoDiscountResult | null } {
  let price = basePrice
  if (sellingPlan && calcSubscriptionPriceFn) {
    price = calcSubscriptionPriceFn(basePrice, sellingPlan)
  }

  const volumeDiscount = calcVolumeDiscount(price, quantity, volumeRules)
  const bogoDiscount = bogoRules ? calcBogoDiscount(price, quantity, bogoRules) : null

  // Pick the best discount
  let unitPrice = price
  if (volumeDiscount && bogoDiscount) {
    unitPrice = Math.min(volumeDiscount.discountedPrice, bogoDiscount.discountedPrice)
  } else if (volumeDiscount) {
    unitPrice = volumeDiscount.discountedPrice
  } else if (bogoDiscount) {
    unitPrice = bogoDiscount.discountedPrice
  }

  return { unitPrice, volumeDiscount, bogoDiscount }
}
