import type { SellingPlan } from '@/lib/supabase'

export const intervalLabel = (interval: string, count: number): string => {
  const labels: Record<string, string> = { day: 'día', week: 'semana', month: 'mes', year: 'año' }
  const plural: Record<string, string> = { day: 'días', week: 'semanas', month: 'meses', year: 'años' }
  return count === 1 ? labels[interval] || interval : `${count} ${plural[interval] || interval}`
}

export const calcSubscriptionPrice = (basePrice: number, plan: SellingPlan): number => {
  if (!plan.discount_type || !plan.discount_value) return basePrice
  if (plan.discount_type === 'percentage') return basePrice * (1 - plan.discount_value / 100)
  if (plan.discount_type === 'fixed') return Math.max(0, basePrice - plan.discount_value)
  return basePrice
}
