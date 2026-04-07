import React, { useMemo, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ShieldCheck, Truck, Lock, RefreshCcw, CreditCard, Store, Building2 } from "lucide-react"
import { callEdge } from "@/lib/edge"
import { STORE_ID, STRIPE_PUBLISHABLE_KEY } from "@/lib/config"
import { useToast } from "@/hooks/use-toast"
import { useNavigate } from "react-router-dom"
import { useCart } from "@/contexts/CartContext"
import { useCheckoutState } from "@/hooks/useCheckoutState"
import { useSettings } from "@/contexts/SettingsContext"
import { trackPurchase, tracking } from "@/lib/tracking-utils"
import type { PaymentMethods } from "@/lib/supabase"

type PaymentMethodType = 'card' | 'oxxo' | 'spei'

// ─── Payment Method Selector ──────────────────────────────────────────────────
function PaymentMethodSelector({ methods, selected, onChange }: {
  methods: PaymentMethodType[]
  selected: PaymentMethodType
  onChange: (m: PaymentMethodType) => void
}) {
  if (methods.length <= 1) return null

  const labels: Record<PaymentMethodType, string> = {
    card: 'Tarjeta',
    oxxo: 'OXXO',
    spei: 'Transferencia SPEI',
  }
  const icons: Record<PaymentMethodType, React.ElementType> = {
    card: CreditCard,
    oxxo: Store,
    spei: Building2,
  }

  return (
    <div className="flex gap-2 mb-2">
      {methods.map(m => {
        const Icon = icons[m]
        return (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className={`flex-1 flex flex-col items-center gap-1.5 border rounded-xl p-3 text-sm font-medium transition-all ${
              selected === m
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/40'
            }`}
          >
            <Icon className="w-5 h-5" />
            {labels[m]}
          </button>
        )
      })}
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────
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
  stripeAccountId?: string | null
  chargeType?: string | null
  paymentMethods?: PaymentMethods
}

// ─── PaymentForm ──────────────────────────────────────────────────────────────
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
  paymentMethods,
}: StripePaymentProps) {
  const stripe = useStripe()
  const elements = useElements()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { clearCart } = useCart()
  const { updateOrderCache, getFreshOrder, getOrderSnapshot } = useCheckoutState()
  const { currencyCode } = useSettings()

  // Compute available payment methods from store settings
  const availableMethods = useMemo<PaymentMethodType[]>(() => {
    const methods: PaymentMethodType[] = []
    if (!paymentMethods || paymentMethods.card !== false) methods.push('card')
    if (paymentMethods?.oxxo) methods.push('oxxo')
    if (paymentMethods?.spei) methods.push('spei')
    return methods.length > 0 ? methods : ['card']
  }, [paymentMethods])

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>(() => availableMethods[0])

  const amountLabel = useMemo(() => {
    const amt = (amountCents || 0) / 100
    const cur = (currency || "usd").toUpperCase()
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
    if (!stripe) {
      toast({ title: "Error", description: "Stripe is not ready", variant: "destructive" })
      return
    }
    if (selectedMethod === 'card' && !elements) {
      toast({ title: "Error", description: "Stripe is not ready", variant: "destructive" })
      return
    }

    // External validation (address fields, etc.)
    if (onValidationRequired && !onValidationRequired()) return

    // Method-specific validation
    if (selectedMethod === 'card') {
      const card = elements?.getElement(CardNumberElement)
      if (!card) {
        toast({ title: "Error", description: "Ingresa los datos de tu tarjeta", variant: "destructive" })
        return
      }
    } else {
      if (!name?.trim() || !email?.trim()) {
        toast({
          title: "Datos requeridos",
          description: "Por favor ingresa tu nombre y correo electrónico para continuar.",
          variant: "destructive"
        })
        return
      }
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

      const seen = new Set<string>()
      const paymentItems = normalizedItems.filter((it: any) => it.product_id && it.quantity > 0).filter((it: any) => {
        const key = `${it.product_id}:${it.variant_id ?? ''}:${it.selling_plan_id ?? ''}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      const totalCents = Math.max(0, Math.floor(amountCents || 0))

      console.log('🔍 StripePayment Debug:', { selectedMethod, totalCents, paymentItems })

      // ─── Inner confirm functions (closures over outer scope vars) ───────────

      const confirmCard = async (clientSecret: string) => {
        const card = elements!.getElement(CardNumberElement)!
        const result = await stripe!.confirmCardPayment(clientSecret, {
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
          trackPurchase({
            products: paymentItems.map((item: any) => tracking.createTrackingProduct({
              id: item.product_id,
              title: item.product_name || item.title,
              price: item.price / 100,
              category: 'product',
              variant: item.variant_id ? { id: item.variant_id } : undefined
            })),
            value: totalCents / 100,
            currency: tracking.getCurrencyFromSettings(currency),
            order_id: orderId,
            custom_parameters: {
              payment_method: 'stripe',
              checkout_token: checkoutToken
            }
          })

          clearCart()

          try {
            const completedOrderItems = paymentItems.map((item: any) => {
              const rawItem = Array.isArray(items) ? items.find((it: any) =>
                (it.product_id || it.product?.id) === item.product_id &&
                (it.variant_id || it.variant?.id) === item.variant_id
              ) : undefined

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
                price: item.price,
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

          navigate(`/gracias/${orderId}`)
          toast({ title: "¡Pago exitoso!", description: "Tu compra fue procesada exitosamente." })
        } else {
          toast({
            title: "Estado del pago",
            description: `Estado: ${result.paymentIntent?.status ?? "desconocido"}`
          })
        }
      }

      const confirmOxxo = async (clientSecret: string) => {
        const result = await stripe!.confirmOxxoPayment(clientSecret, {
          payment_method: {
            billing_details: { name: name || '', email: email || '' }
          }
        })

        if (result.error) {
          toast({ title: "Error", description: result.error.message, variant: "destructive" })
          return
        }

        const pi = result.paymentIntent
        if (pi?.status === 'requires_action' || pi?.status === 'pending') {
          const oxxoDetails = (pi as any).next_action?.oxxo_display_details
          sessionStorage.setItem('pending_payment', JSON.stringify({
            method: 'oxxo',
            reference: oxxoDetails?.number,
            hosted_voucher_url: oxxoDetails?.hosted_voucher_url,
            expires_at: oxxoDetails?.expires_at,
            amount: (pi.amount ?? 0) / 100,
            currency: pi.currency?.toUpperCase() || (currency || 'mxn').toUpperCase(),
            order_id: orderId,
          }))
          clearCart()
          navigate(`/pago-pendiente/${orderId}`)
        }
      }

      const confirmSpei = async (clientSecret: string) => {
        const result = await (stripe as any).confirmCustomerBalancePayment(clientSecret, {
          payment_method: { type: 'customer_balance' },
          payment_method_options: {
            customer_balance: {
              funding_type: 'bank_transfer',
              bank_transfer: { type: 'mx_bank_transfer' }
            }
          }
        }, { handleActions: false })

        if (result.error) {
          toast({ title: "Error", description: result.error.message, variant: "destructive" })
          return
        }

        const pi = result.paymentIntent
        const financialAddresses = (pi as any)?.next_action?.display_bank_transfer_instructions?.financial_addresses || []
        const speiAddress = financialAddresses.find((fa: any) => fa.type === 'spei')

        sessionStorage.setItem('pending_payment', JSON.stringify({
          method: 'spei',
          clabe: speiAddress?.spei?.clabe,
          bank_name: speiAddress?.spei?.bank_name,
          hosted_instructions_url: (pi as any)?.next_action?.display_bank_transfer_instructions?.hosted_instructions_url,
          amount: ((pi?.amount ?? 0) / 100),
          currency: pi?.currency?.toUpperCase() || (currency || 'mxn').toUpperCase(),
          order_id: orderId,
        }))
        clearCart()
        navigate(`/pago-pendiente/${orderId}`)
      }

      // ─── Build payload ───────────────────────────────────────────────────────
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
        customer: { email, name, phone },
        capture_method: "automatic",
        use_stripe_connect: true,
        payment_method: selectedMethod, // 'card' | 'oxxo' | 'spei'
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
          ...(metadata?.discount_code ? { discount_code: metadata.discount_code } : {})
        },
        ...(pickupLocations && pickupLocations.length === 1 ? {
          delivery_method: "pickup",
          pickup_locations: pickupLocations.map(loc => ({
            id: loc.id || loc.name,
            name: loc.name || "",
            address: `${loc.line1 || ""}, ${loc.city || ""}, ${loc.state || ""}, ${loc.country || ""}`,
            hours: loc.schedule || ""
          }))
        } : deliveryExpectations && deliveryExpectations.length > 0 && deliveryExpectations[0]?.type !== "pickup" ? {
          delivery_expectations: deliveryExpectations.map((exp: any) => ({
            type: exp.type || "standard_delivery",
            description: exp.description || "",
            ...(exp.price !== undefined ? { estimated_days: "3-5" } : {})
          }))
        } : {})
      }

      // ─── Get client_secret ───────────────────────────────────────────────────
      const hasSubscription = paymentItems.some((it: any) => it.selling_plan_id)
      let client_secret: string | undefined

      if (hasSubscription && selectedMethod === 'card') {
        // SUBSCRIPTION FLOW (card only)
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

        const data = await callEdge('subscription-create', subPayload)

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
      } else if (hasSubscription) {
        toast({
          title: "Método no disponible",
          description: "Las suscripciones solo admiten pago con tarjeta.",
          variant: "destructive"
        })
        return
      } else {
        // ONE-TIME FLOW
        console.log('🔍 StripePayment payload sent:', JSON.stringify(payload, null, 2))
        const data = await callEdge("payments-create-intent", payload)

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

      console.log("Client secret recibido, confirmando pago con método:", selectedMethod)

      // ─── Branch by payment method ────────────────────────────────────────────
      if (selectedMethod === 'card') {
        await confirmCard(client_secret)
      } else if (selectedMethod === 'oxxo') {
        await confirmOxxo(client_secret)
      } else if (selectedMethod === 'spei') {
        await confirmSpei(client_secret)
      }

    } catch (err: any) {
      console.error("Error en el proceso de pago:", err)

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
            updateOrderCache(normalizeOrderFromResponse(parsed))
            setLoading(false)
            return
          }
        } catch (parseErr) {
          console.warn("Failed to parse error JSON from edge response:", parseErr)
        }
      }

      let errorMessage = "No se pudo procesar el pago"
      if (err?.message) errorMessage = err.message
      else if (typeof err === 'string') errorMessage = err
      else if (err?.error) errorMessage = err.error

      toast({ title: "Error de pago", description: errorMessage, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Button label by method
  const buttonLabel = selectedMethod === 'oxxo'
    ? 'Generar Voucher OXXO'
    : selectedMethod === 'spei'
    ? 'Obtener CLABE SPEI'
    : 'Completar Compra'

  return (
    <div className="space-y-6">
      {/* SSL Trust Badge */}
      <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
        <Lock className="w-3 h-3 shrink-0" />
        <span className="text-xs">Pago seguro encriptado con SSL</span>
      </div>

      {/* Payment Method Selector — solo aparece cuando hay más de uno habilitado */}
      <PaymentMethodSelector
        methods={availableMethods}
        selected={selectedMethod}
        onChange={setSelectedMethod}
      />

      {/* ── Tarjeta ── */}
      {selectedMethod === 'card' && (
        <Card className="border-0 shadow-none sm:border sm:shadow-sm">
          <CardContent className="p-0 sm:p-6">
            <div className="flex items-center justify-between mb-4 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-4 h-4 rounded-full border-2 border-primary bg-primary shrink-0"></div>
                <span className="font-medium whitespace-nowrap">Tarjeta de crédito</span>
              </div>
              <img src="/lovable-uploads/43c70209-0949-4d87-9c23-50bea4ff2d48.png" alt="Tarjetas aceptadas" className="h-6 shrink-0" />
            </div>

            <div className="space-y-3">
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
      )}

      {/* ── OXXO ── */}
      {selectedMethod === 'oxxo' && (
        <Card className="border-0 shadow-none sm:border sm:shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <Store className="w-5 h-5 text-primary shrink-0" />
              <span className="font-medium">Pago en OXXO</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Al confirmar se generará un voucher con una referencia única. Paga el monto exacto en cualquier tienda OXXO.
            </p>
            <p className="text-sm text-muted-foreground mt-1.5">
              El pago se confirma en hasta <strong className="text-foreground">1 hora</strong> después de realizarlo.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── SPEI ── */}
      {selectedMethod === 'spei' && (
        <Card className="border-0 shadow-none sm:border sm:shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <Building2 className="w-5 h-5 text-primary shrink-0" />
              <span className="font-medium">Transferencia SPEI</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Al confirmar recibirás una CLABE interbancaria para realizar la transferencia desde tu banco o app.
            </p>
            <p className="text-sm text-muted-foreground mt-1.5">
              El pago se confirma en <strong className="text-foreground">30 minutos – 4 horas</strong>.
            </p>
          </CardContent>
        </Card>
      )}

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
            <span className="text-base font-semibold">{buttonLabel}</span>
            <span className="text-sm font-normal opacity-85">{amountLabel}</span>
          </span>
        )}
      </Button>

      {/* Trust pack */}
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
        Al hacer clic en "{buttonLabel}", aceptas nuestros términos y condiciones.
        <span className="block mt-1">¿Dudas con tu pedido? Contáctanos y lo resolvemos. Sin letra pequeña.</span>
      </div>
    </div>
  )
}

// ─── StripePayment (outer wrapper with Elements provider) ─────────────────────
export default function StripePayment(props: StripePaymentProps) {
  const stripePromise = useMemo(() => {
    const opts = props.chargeType === 'direct' && props.stripeAccountId
      ? { stripeAccount: props.stripeAccountId }
      : {}
    return loadStripe(STRIPE_PUBLISHABLE_KEY, opts)
  }, [props.stripeAccountId, props.chargeType])

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