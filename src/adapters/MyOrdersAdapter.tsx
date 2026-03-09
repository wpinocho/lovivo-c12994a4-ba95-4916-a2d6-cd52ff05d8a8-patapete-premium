/**
 * NO EDITAR - Solo referencia para el agente de IA
 * TIPO C - FORBIDDEN ADAPTER
 * 
 * MyOrdersAdapter: Maneja la lógica de obtener órdenes del usuario
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { STORE_ID } from '@/lib/config'
import { useAuth } from '@/hooks/useAuth'
import type { Order } from '@/lib/supabase'

interface UseMyOrdersLogic {
  orders: Order[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useMyOrdersLogic = (): UseMyOrdersLogic => {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = async () => {
    if (!user) {
      setOrders([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // ✅ Usa VIEW segura orders_customer (excluye campos sensibles)
      // RLS con security_invoker filtra por auth.uid() automáticamente
      const { data, error: fetchError } = await supabase
        .from('orders_customer')
        .select(`
          *,
          order_items (
            *,
            products (
              id,
              title,
              images,
              price,
              compare_at_price
            )
          ),
          customers (
            email,
            first_name,
            last_name
          )
        `)
        .eq('store_id', STORE_ID)
        .neq('status', 'pending')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setOrders(data || [])
    } catch (err: any) {
      console.error('Error fetching orders:', err)
      setError(err.message || 'Error loading your orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [user])

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders
  }
}
