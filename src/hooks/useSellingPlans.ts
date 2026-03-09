import { useState, useEffect } from 'react'
import { supabase, type SellingPlan } from '@/lib/supabase'
import { STORE_ID } from '@/lib/config'

export const useSellingPlans = (productId: string | undefined) => {
  const [plans, setPlans] = useState<SellingPlan[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!productId) return
    setLoading(true)
    const fetchPlans = async () => {
      const { data } = await supabase
        .from('product_selling_plans')
        .select('selling_plan_id, selling_plans(*)')
        .eq('product_id', productId)
        .eq('store_id', STORE_ID)
      const activePlans = (data || [])
        .map((d: any) => d.selling_plans)
        .filter((p: any) => p?.active !== false)
      setPlans(activePlans)
      setLoading(false)
    }
    fetchPlans()
  }, [productId])

  return { plans, loading }
}
