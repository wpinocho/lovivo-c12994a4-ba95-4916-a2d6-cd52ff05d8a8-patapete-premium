import { useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { STORE_ID } from '@/lib/config'
import { useCart } from '@/contexts/CartContext'
import { parseCartItems, sanitizeURLParams, parseCheckoutParams } from '@/lib/url-params'
import type { Product, ProductVariant } from '@/lib/supabase'

/**
 * Hook global que detecta parámetros de carrito en la URL,
 * carga los productos desde la BD, los agrega al carrito,
 * y redirige a /carrito.
 *
 * Funciona en CUALQUIER página. Se monta una sola vez en App.tsx.
 *
 * Params soportados:
 *   ?items=productId:qty,productId:qty   → múltiples productos
 *   ?variant=variantId&quantity=2         → producto individual por variante
 *   ?discount=SAVE20                      → código de descuento (se guarda en sessionStorage)
 *   ?email=...&firstName=...              → datos de contacto (se guardan en sessionStorage)
 */
export function useURLCartLoader() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { addItem, clearCart } = useCart()
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return

    const raw = parseCheckoutParams(searchParams)
    const params = sanitizeURLParams(raw)

    // Only act if there are cart-related params
    const hasItems = !!params.items
    const hasVariant = !!params.variant
    if (!hasItems && !hasVariant) return

    processed.current = true

    // Store contact info for checkout to pick up later
    if (params.email) sessionStorage.setItem('url_email', params.email)
    if (params.firstName) sessionStorage.setItem('url_firstName', params.firstName)
    if (params.lastName) sessionStorage.setItem('url_lastName', params.lastName)
    if (params.phone) sessionStorage.setItem('url_phone', params.phone)
    if (params.discount) {
      sessionStorage.setItem('pendingDiscount', params.discount)
      console.log('🎟️ Discount from URL stored:', params.discount)
    }

    const loadAndAdd = async () => {
      try {
        if (hasItems) {
          // Multi-product mode: ?items=id1:qty,id2:qty
          const entries = parseCartItems(params.items!)
          if (entries.length === 0) return

          const productIds = entries.map(e => e.productId)

          const { data: products, error } = await supabase
            .from('products')
            .select('*, variants:product_variants(*)')
            .eq('store_id', STORE_ID)
            .in('id', productIds)

          if (error || !products?.length) {
            console.error('Failed to fetch products for URL cart:', error)
            return
          }

          // Clear cart before loading URL items for a clean state
          clearCart()

          for (const entry of entries) {
            const product = products.find((p: Product) => p.id === entry.productId)
            if (!product) {
              console.warn(`Product ${entry.productId} not found, skipping`)
              continue
            }

            // Pick cheapest variant if product has variants
            const variant = product.variants?.length
              ? [...product.variants].sort((a: ProductVariant, b: ProductVariant) =>
                  (a.price ?? Infinity) - (b.price ?? Infinity)
                )[0]
              : undefined

            for (let i = 0; i < entry.quantity; i++) {
              addItem(product, variant)
            }
          }
        } else if (hasVariant) {
          // Single variant mode: ?variant=variantId&quantity=2
          const qty = parseInt(params.quantity || '1') || 1

          const { data: variant, error: vErr } = await supabase
            .from('product_variants')
            .select('*, product:products(*)')
            .eq('id', params.variant!)
            .eq('product.store_id', STORE_ID)
            .single()

          if (vErr || !variant?.product) {
            console.error('Failed to fetch variant for URL cart:', vErr)
            return
          }

          clearCart()

          for (let i = 0; i < qty; i++) {
            addItem(variant.product as Product, variant as ProductVariant)
          }
        }

        // Clean URL params and navigate to cart
        setSearchParams({}, { replace: true })
        navigate('/carrito', { replace: true })
        console.log('🛒 Cart loaded from URL params')
      } catch (err) {
        console.error('Error loading cart from URL:', err)
      }
    }

    loadAndAdd()
  }, [searchParams, addItem, clearCart, navigate, setSearchParams])
}
