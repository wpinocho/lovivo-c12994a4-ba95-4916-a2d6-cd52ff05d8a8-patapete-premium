import React, { useMemo, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ShieldCheck, Truck, Lock, RefreshCcw } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { callEdge } from "@/lib/edge"
import { STORE_ID, STRIPE_PUBLISHABLE_KEY } from "@/lib/config"
import { useToast } from "@/hooks/use-toast"
import { useNavigate } from "react-router-dom"
import { useCart } from "@/contexts/CartContext"
import { useCheckoutState } from "@/hooks/useCheckoutState"
import { useSettings } from "@/contexts/SettingsContext"
import { trackPurchase, tracking } from "@/lib/tracking-utils"

interface StripePaymentProps {
  amountCents: number
  currency?: string
  description?: string
  metadata?: Record<string, string>
  email?: string
  name?: string
  phone?: string
  orderId?: string
  checkoutToken?: string
  onValidationRequired?: () => boolean
  expectedTotal?: number
  deliveryFee?: number
  shippingAddress?: any
  billingAddress?: any
  items?: any[]
  deliveryExpectations?: any[]
  pickupLocations?: any[]
}

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)

function PaymentForm({
  amountCents,
  currency = "usd",
  description,
  metadata,
  email,
  name,
  phone,
  orderId,
  checkoutToken,
  onValidationRequired,
  expectedTotal,
  deliveryFee = 0,
  shippingAddress,
  billingAddress,
  items = [],
  deliveryExpectations = [],
  pickupLocations = [],
}: StripePaymentProps) {
  const stripe = useStripe()
  const elements = useElements()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { clearCart } = useCart()
  const { updateOrderCache, getFreshOrder, getOrderSnapshot } = useCheckoutState()
  const { currencyCode } = useSettings()

  const amountLabel = useMemo(() => {
    const amt = (amountCents || 0) / 100
    const cur = (currency || "usd").toUpperCase()
    // Remove unnecessary .00 decimals
    const formatted = amt % 1 === 0
      ? `$${amt.toLocaleString('es-MX')}`
      : `$${amt.toFixed(2)}`
    return `${formatted} ${cur}`
  }, [amountCents, currency])

  // Normalize edge response into an order-like object for our cache
  const normalizeOrderFromResponse = (resp: any) => {
    if (resp?.order) return resp.order
    return {
      id: resp?.order_id ?? orderId,
      store_id: STORE_ID,
      checkout_token: resp?.checkout_token ?? checkoutToken,
      currency_code: resp?.currency_code,
      subtotal: resp?.subtotal,
      discount_amount: resp?.discount_amount,
      total_amount: resp?.total_amount,
      order_items: Array.isArray(resp?.order_items) ? resp.order_items : []
    }
  }

  const handleFinalizarCompra = async () => {
    if (!stripe || !elements) {
      toast({ title: "Error", description: "Stripe is not ready", variant: "destructive" })
      return
    }
    
    // Validar campos requeridos antes de procesar el pago
    if (onValidationRequired && !onValidationRequired()) {
      return
    }
    
    const card = elements.getElement(CardNumberElement)
    if (!card) {
      toast({ title: "Error", description: "Ingresa los datos de tu tarjeta", variant: "destructive" })
      return
    }
    
    // Validation for pickup mode
    if (deliveryExpectations?.[0]?.type === "pickup" && (!pickupLocations || pickupLocations.length === 0)) {
      toast({ 
        title: "Punto de recogida requerido", 
        description: "Por favor selecciona un punto de recogida antes de continuar.", 
        variant: "destructive" 
      })
      return
    }

    try {
      setLoading(true)

      // Prefer backend order items when available to avoid stale UI
      const sourceOrder = (typeof getFreshOrder === 'function' ? getFreshOrder() : null) || (typeof getOrderSnapshot === 'function' ? getOrderSnapshot() : null)

      // Build a normalized items list prioritizing backend order items
      const rawItems: any[] = (Array.isArray(items) && items.length > 0)
        ? items
        : (sourceOrder && Array.isArray(sourceOrder.order_items) ? sourceOrder.order_items : [])

      const normalizedItems = rawItems.map((it: any) => ({
        product_id: it.product_id || it.product?.id || '',
        variant_id: it.variant_id || it.variant?.id,
        quantity: Number(it.quantity ?? 0),
        price: Number(it.variant_price ?? it.variant?.price ?? it.price ?? it.unit_price ?? 0),
        selling_plan_id: it.selling_plan_id || undefined,
        product_name: it.product_name || it.product?.name || '',
      }))

      // Filter zero/invalid and deduplicate by product_id+variant_id+selling_plan_id
      const seen = new Set<string>()
      const paymentItems = normalizedItems.filter((it: any) => it.product_id && it.quantity > 0).filter((it: any) => {
        const key = `${it.product_id}:${it.variant_id ?? ''}:${it.selling_plan_id ?? ''}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      // Debug logging for total amount calculation
      console.log('🔍 StripePayment Debug:')
      console.log('sourceOrder:', sourceOrder)
      console.log('UI amountCents prop:', amountCents)
      console.log('UI items (from props):', items)
      console.log('Raw items selected:', rawItems)
      console.log('Normalized items:', normalizedItems)
      console.log('Filtered paymentItems (deduped):', paymentItems)

      // Calculate total in cents from UI amount (what user sees on button)
      const totalCents = Math.max(0, Math.floor(amountCents || 0))
      console.log('totalCents (from UI):', totalCents)

      console.log('📦 Items used for payment:', paymentItems.map((it: any) => ({ key: `${(it.product_id || it.product?.id) ?? ''}${(it.variant_id || it.variant?.id) ? `:${it.variant_id || it.variant?.id}` : ''}`, product_id: it.product_id || it.product?.id, variant_id: it.variant_id || it.variant?.id, quantity: it.quantity })))

      const payload = {
        store_id: STORE_ID,
        order_id: orderId,
        checkout_token: checkoutToken,
        amount: totalCents,
        currency: currency || "mxn",
        expected_total: expectedTotal || totalCents,
        delivery_fee: deliveryFee,
        description: description || `Pedido #${orderId ?? "s/n"}`,
        metadata: { order_id: orderId ?? "", ...(metadata || {}) },
        receipt_email: email,
        customer: {
          email,
          name,
          phone,
        },
        capture_method: "automatic",
        use_stripe_connect: true,
        validation_data: {
          shipping_address: shippingAddress ? {
            line1: shippingAddress.line1 || "",
            line2: shippingAddress.line2 || "",
            city: shippingAddress.city || "",
            state: shippingAddress.state || "",
            postal_code: shippingAddress.postal_code || "",
            country: shippingAddress.country || "",
            name: `${shippingAddress.first_name || ""} ${shippingAddress.last_name || ""}`.trim()
          } : null,
          billing_address: billingAddress ? {
            line1: billingAddress.line1 || "",
            line2: billingAddress.line2 || "",
            city: billingAddress.city || "",
            state: billingAddress.state || "",
            postal_code: billingAddress.postal_code || "",
            country: billingAddress.country || "",
            name: `${billingAddress.first_name || ""} ${billingAddress.last_name || ""}`.trim()
          } : null,
          items: paymentItems.map((item: any) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            ...(item.variant_id ? { variant_id: item.variant_id } : {}),
            price: Math.max(0, Math.round(Number(item.price) * 100))
          })),
          // Incluir discount_code si existe
          ...(metadata?.discount_code ? { discount_code: metadata.discount_code } : {})
        },
        // Handle pickup vs delivery logic
        ...(pickupLocations && pickupLocations.length === 1 ? {
          // Pickup mode: add delivery_method and pickup location
          delivery_method: "pickup",
          pickup_locations: pickupLocations.map(loc => ({
            id: loc.id || loc.name,
            name: loc.name || "",
            address: `${loc.line1 || ""}, ${loc.city || ""}, ${loc.state || ""}, ${loc.country || ""}`,
            hours: loc.schedule || ""
          }))
          // No delivery_expectations for pickup
        } : deliveryExpectations && deliveryExpectations.length > 0 && deliveryExpectations[0]?.type !== "pickup" ? {
          // Delivery mode: add delivery expectations
          delivery_expectations: deliveryExpectations.map((exp: any) => ({
            type: exp.type || "standard_delivery",
            description: exp.description || "",
            ...(exp.price !== undefined ? { estimated_days: "3-5" } : {})
          }))
          // No pickup_locations for delivery
        } : {})
      }

      console.log('🔍 Final delivery/pickup data:', {
        hasPickupLocations: pickupLocations?.length,
        pickupLocations,
        deliveryExpectations,
        isPickupMode: pickupLocations?.length === 1,
        shippingAddress: payload.validation_data?.shipping_address ? 'present' : 'null'
      })
      // Detect if there are subscription items
      const hasSubscription = paymentItems.some((it: any) => it.selling_plan_id)

      let client_secret: string | undefined

      if (hasSubscription) {
        // SUBSCRIPTION FLOW
        const subscriptionItems = paymentItems.filter((it: any) => it.selling_plan_id)
        const oneTimeItems = paymentItems.filter((it: any) => !it.selling_plan_id)
        const mainItem = subscriptionItems[0]

        const subPayload = {
          store_id: STORE_ID,
          selling_plan_id: mainItem.selling_plan_id,
          recurring_items: subscriptionItems.map((i: any) => ({
            product_id: i.product_id,
            variant_id: i.variant_id,
            quantity: i.quantity,
          })),
          order_id: orderId,
          customer: { email, name },
          one_time_items: oneTimeItems.length > 0 ? oneTimeItems.map((i: any) => ({
            product_id: i.product_id,
            variant_id: i.variant_id,
            quantity: i.quantity,
            price: i.price,
            title: i.product_name || '',
          })) : undefined,
        }

        console.log('🔍 Subscription payment payload:', JSON.stringify(subPayload, null, 2))
        const data = await callEdge('subscription-create', subPayload)

        // Handle unavailable items from subscription-create
        if (data?.unavailable_items && data.unavailable_items.length > 0) {
          const unavailableNames = data.unavailable_items.map((item: any) =>
            item.variant_name ? `${item.product_name} (${item.variant_name})` : item.product_name
          ).join(', ')
          toast({
            title: "Items Out of Stock",
            description: `The following items are out of stock: ${unavailableNames}.`,
            variant: "destructive"
          })
          updateOrderCache(normalizeOrderFromResponse(data))
          return
        }

        client_secret = data?.client_secret
      } else {
        // ONE-TIME FLOW (existing)
        console.log('🔍 StripePayment payload sent:', JSON.stringify(payload, null, 2))
        const data = await callEdge("payments-create-intent", payload)

        // Handle defensive case if backend returns updated order with unavailable_items in a 200
        if (data?.unavailable_items && data.unavailable_items.length > 0) {
          const unavailableNames = data.unavailable_items.map((item: any) =>
            item.variant_name ? `${item.product_name} (${item.variant_name})` : item.product_name
          ).join(', ')
          toast({
            title: "Items Out of Stock",
            description: `The following items are out of stock: ${unavailableNames}. Please remove them from your cart to complete your order.`,
            variant: "destructive"
          })
          updateOrderCache(normalizeOrderFromResponse(data))
          return
        }

        client_secret = data?.client_secret
      }

      if (!client_secret) {
        throw new Error("No se recibió client_secret del servidor")
      }

      console.log("Client secret recibido, confirmando pago...")
      console.log("Client secret:", client_secret)

      // Con Destination Charges siempre usamos la misma instancia de Stripe (plataforma)
      const result = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card,
          billing_details: {
            email: email || undefined,
            name: name || undefined,
            phone: phone || undefined,
          },
        },
      })

      if (result.error) {
        console.error("Error confirmando pago:", result.error)
        toast({ 
          title: "Pago fallido", 
          description: result.error.message || "Hubo un error al procesar el pago", 
          variant: "destructive" 
        })
        return
      }

      if (result.paymentIntent?.status === "succeeded") {
        // Track Purchase event with proper formatting
        trackPurchase({
          products: paymentItems.map((item: any) => tracking.createTrackingProduct({
            id: item.product_id,
            title: item.product_name || item.title,
            price: item.price / 100, // Convert from cents
            category: 'product',
            variant: item.variant_id ? { id: item.variant_id } : undefined
          })),
          value: totalCents / 100, // Convert from cents
          currency: tracking.getCurrencyFromSettings(currency),
          order_id: orderId,
          custom_parameters: {
            payment_method: 'stripe',
            checkout_token: checkoutToken
          }
        })
        
        // Limpiar carrito
        clearCart()
        
        // Save order details to localStorage for ThankYou page
        try {
          const completedOrderItems = paymentItems.map((item: any) => {
            // Find the raw item to extract image and variant info
            const rawItem = Array.isArray(items) ? items.find((it: any) =>
              (it.product_id || it.product?.id) === item.product_id &&
              (it.variant_id || it.variant?.id) === item.variant_id
            ) : undefined

            // Try to get Patapete preview image from localStorage (still present at this point)
            let productImages: string[] = []
            const itemKey = rawItem?.key
            if (itemKey) {
              try {
                const stored = localStorage.getItem(`patapete_customization:${itemKey}`)
                if (stored) {
                  const parsed = JSON.parse(stored)
                  const previewUrl = parsed.preview_image_url || parsed.preview_dataurl
                  if (previewUrl) productImages = [previewUrl]
                }
              } catch { /* ignore */ }
            }
            // Fallback to product images
            if (productImages.length === 0) {
              if ((rawItem as any)?.preview_image_url) productImages = [(rawItem as any).preview_image_url]
              else if (rawItem?.product?.images?.length) productImages = rawItem.product.images
              else if ((rawItem as any)?.product_images?.length) productImages = (rawItem as any).product_images
            }

            return {
              product_id: item.product_id,
              variant_id: item.variant_id,
              product_name: item.product_name || rawItem?.product?.name || '',
              variant_name: rawItem?.variant?.name || (rawItem as any)?.variant_name || '',
              quantity: item.quantity,
              price: item.price, // normal currency units (e.g. 949 MXN)
              product_images: productImages,
            }
          })

          const completedOrder = {
            id: orderId,
            order_number: orderId?.slice(-8).toUpperCase() ?? 'N/A',
            total_amount: totalCents / 100,
            currency_code: (currency || 'mxn').toUpperCase(),
            status: 'paid',
            shipping_address: shippingAddress ? {
              first_name: shippingAddress.first_name || '',
              last_name: shippingAddress.last_name || '',
              address1: shippingAddress.line1 || '',
              address2: shippingAddress.line2 || '',
              city: shippingAddress.city || '',
              province: shippingAddress.state || '',
              zip: shippingAddress.postal_code || '',
              country: shippingAddress.country || '',
              phone: phone || '',
            } : null,
            billing_address: billingAddress ? {
              first_name: billingAddress.first_name || '',
              last_name: billingAddress.last_name || '',
              address1: billingAddress.line1 || '',
              city: billingAddress.city || '',
              province: billingAddress.state || '',
              zip: billingAddress.postal_code || '',
              country: billingAddress.country || '',
            } : null,
            order_items: completedOrderItems,
            created_at: new Date().toISOString(),
          }

          localStorage.setItem('completed_order', JSON.stringify(completedOrder))
          console.log('✅ completed_order saved to localStorage:', completedOrder)
        } catch (saveErr) {
          console.error('Error saving completed_order to localStorage:', saveErr)
        }
        
        // Redirigir a thank you page
        navigate(`/gracias/${orderId}`)
        
        toast({ 
          title: "¡Pago exitoso!", 
          description: "Tu compra fue procesada exitosamente." 
        })
      } else {
        toast({ 
          title: "Estado del pago", 
          description: `Estado: ${result.paymentIntent?.status ?? "desconocido"}` 
        })
      }
    } catch (err: any) {
      console.error("Error en el proceso de pago:", err)

      // Try to parse structured error from Edge Function (contains unavailable_items and updated order)
      const message = err?.message || ""
      const jsonStart = message.indexOf("{")
      const jsonEnd = message.lastIndexOf("}")
      if (jsonStart !== -1 && jsonEnd !== -1) {
        try {
          const parsed = JSON.parse(message.slice(jsonStart, jsonEnd + 1))

          if (parsed?.unavailable_items && parsed.unavailable_items.length > 0) {
            const unavailableNames = parsed.unavailable_items.map((item: any) =>
              item.variant_name ? `${item.product_name} (${item.variant_name})` : item.product_name
            ).join(', ')

            toast({
              title: "Productos sin inventario",
              description: `Los siguientes productos no tienen stock disponible: ${unavailableNames}. Por favor elimínalos de tu carrito para continuar.`,
              variant: "destructive"
            })

            // Update cache with backend response (backend already filtered out unavailable items)
            updateOrderCache(normalizeOrderFromResponse(parsed))

            setLoading(false)
            return
          }
        } catch (parseErr) {
          console.warn("Failed to parse error JSON from edge response:", parseErr)
        }
      }
      
      // Fallback generic error
      let errorMessage = "No se pudo procesar el pago"
      if (err?.message) errorMessage = err.message
      else if (typeof err === 'string') errorMessage = err
      else if (err?.error) errorMessage = err.error

      toast({ 
        title: "Error de pago", 
        description: errorMessage, 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* SSL Trust Banner */}
      <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
          <Lock className="w-4 h-4 text-green-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-green-800">Pago 100% seguro · Encriptado SSL</p>
          <p className="text-xs text-green-700 mt-0.5">Procesado por Stripe — estándar mundial de pagos seguros</p>
        </div>
        <div className="shrink-0 flex items-center gap-1.5">
          <svg viewBox="0 0 48 16" className="h-4" aria-label="Visa">
            <rect width="48" height="16" rx="2" fill="#1A1F71"/>
            <text x="50%" y="12" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial">VISA</text>
          </svg>
          <svg viewBox="0 0 32 20" className="h-4" aria-label="Mastercard">
            <circle cx="12" cy="10" r="10" fill="#EB001B"/>
            <circle cx="20" cy="10" r="10" fill="#F79E1B"/>
            <path d="M16 4.8a10 10 0 0 1 0 10.4A10 10 0 0 1 16 4.8z" fill="#FF5F00"/>
          </svg>
        </div>
      </div>

      {/* Sección de pago con tarjeta */}
      <Card className="border-0 shadow-none sm:border sm:shadow-sm">
        <CardContent className="p-0 sm:p-6">
          <div className="flex items-center justify-between mb-4 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-4 h-4 rounded-full border-2 border-primary bg-primary shrink-0"></div>
              <span className="font-medium whitespace-nowrap">Tarjeta de crédito</span>
            </div>
            <img src="/lovable-uploads/43c70209-0949-4d87-9c23-50bea4ff2d48.png" alt="Tarjetas aceptadas" className="h-6 shrink-0" />
          </div>

          {/* Formulario de tarjeta - campos separados para mejor UX mobile */}
          <div className="space-y-3">
            {/* Número de tarjeta */}
            <div className="border rounded-lg p-2.5 sm:p-3 bg-background">
              <CardNumberElement
                options={{
                  style: {
                    base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } },
                    invalid: { color: '#9e2146' },
                  },
                  placeholder: 'Número de tarjeta',
                }}
              />
            </div>
            {/* Expiración + CVC lado a lado */}
            <div className="grid grid-cols-2 gap-3">
              <div className="border rounded-lg p-2.5 sm:p-3 bg-background">
                <CardExpiryElement
                  options={{
                    style: {
                      base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } },
                      invalid: { color: '#9e2146' },
                    },
                  }}
                />
              </div>
              <div className="border rounded-lg p-2.5 sm:p-3 bg-background">
                <CardCvcElement
                  options={{
                    style: {
                      base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } },
                      invalid: { color: '#9e2146' },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón de finalizar compra */}
      <Button 
        onClick={handleFinalizarCompra} 
        disabled={!stripe || loading || !amountCents}
        className="w-full h-auto py-3.5 font-semibold"
        size="lg"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            <span>Procesando...</span>
          </div>
        ) : (
          <span className="flex flex-col items-center leading-tight gap-0.5">
            <span className="text-base font-semibold">Completar Compra</span>
            <span className="text-sm font-normal opacity-85">{amountLabel}</span>
          </span>
        )}
      </Button>

      {/* Trust pack — garantías justo después del botón */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-muted/40 py-3 px-2 text-center">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <span className="text-[10px] font-semibold text-foreground leading-tight">Garantía Patapete</span>
          <span className="text-[10px] text-muted-foreground leading-tight">Reponemos sin costo si llega con defecto</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-muted/40 py-3 px-2 text-center">
          <Truck className="w-4 h-4 text-primary shrink-0" />
          <span className="text-[10px] font-semibold text-foreground leading-tight">Envío gratis</span>
          <span className="text-[10px] text-muted-foreground leading-tight">A todo México incluido</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-muted/40 py-3 px-2 text-center">
          <RefreshCcw className="w-4 h-4 text-primary shrink-0" />
          <span className="text-[10px] font-semibold text-foreground leading-tight">Sin complicaciones</span>
          <span className="text-[10px] text-muted-foreground leading-tight">¿Problema? Lo resolvemos</span>
        </div>
      </div>

      <div className="text-xs text-muted-foreground text-center leading-relaxed">
        Al hacer clic en "Completar Compra", aceptas nuestros términos y condiciones.
        <span className="block mt-1">¿Dudas con tu pedido? Contáctanos y lo resolvemos. Sin letra pequeña.</span>
      </div>
    </div>
  )
}

export default function StripePayment(props: StripePaymentProps) {
  if (!stripePromise) {
    return (
      <div className="text-sm text-muted-foreground">
        Error: No se pudo cargar Stripe. Verifica tu configuración.
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  )
}