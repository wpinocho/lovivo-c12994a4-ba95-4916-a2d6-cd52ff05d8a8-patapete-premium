import { useState, useEffect, useCallback } from 'react'
import { supabase, type SubscriptionContract } from '@/lib/supabase'
import { callEdge } from '@/lib/edge'
import { STORE_ID } from '@/lib/config'
import { useToast } from '@/hooks/use-toast'

export const useSubscriptions = (userId: string | undefined) => {
  const [contracts, setContracts] = useState<SubscriptionContract[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchContracts = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('subscription_contracts')
        .select('*, selling_plans(*), products(title, images)')
        .eq('store_id', STORE_ID)
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })

      if (err) throw err
      setContracts(data || [])
    } catch (err: any) {
      setError(err.message || 'Error loading subscriptions')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  const manage = useCallback(async (contractId: string, action: 'pause' | 'resume' | 'cancel') => {
    try {
      await callEdge('subscription-manage', {
        store_id: STORE_ID,
        contract_id: contractId,
        action
      })
      const labels = { pause: 'pausada', resume: 'reanudada', cancel: 'cancelada' }
      toast({ title: `Suscripción ${labels[action]}` })
      await fetchContracts()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }, [fetchContracts, toast])

  return {
    contracts,
    loading,
    error,
    refetch: fetchContracts,
    pause: (id: string) => manage(id, 'pause'),
    resume: (id: string) => manage(id, 'resume'),
    cancel: (id: string) => manage(id, 'cancel'),
  }
}
