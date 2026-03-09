import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { useCart } from "@/contexts/CartContext"
import type { CartProductItem } from "@/contexts/CartContext"
import { useCheckout } from "@/hooks/useCheckout"
import { useSettings } from "@/contexts/SettingsContext"
import { Minus, Plus, Trash2, ExternalLink, Package, X, Loader2, Tag, RefreshCw, Gift } from "lucide-react"
import { useNavigate, Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { FreeShippingBar } from "@/components/ui/FreeShippingBar"
import { useToast } from "@/hooks/use-toast"
import { callEdgeFetch } from "@/lib/edge"
import { STORE_ID } from "@/lib/config"
import { validateDiscount, type Discount } from "@/lib/discount-utils"
import { intervalLabel, calcSubscriptionPrice } from "@/lib/subscription-utils"
import { usePriceRules } from "@/hooks/usePriceRules"
import { calcItemUnitPrice } from "@/lib/price-rule-utils"
import { BOGOGiftBanner } from "@/components/ui/BOGOGiftBanner"

interface CartSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export const CartSidebar = ({ isOpen, onClose }: CartSidebarProps) => {
  const { state, updateQuantity, removeItem, clearCart, addItem } = useCart()
  const navigate = useNavigate()
  const { checkout, isLoading: isCreatingOrder } = useCheckout()
  const { currencyCode, formatMoney } = useSettings()
  const { toast } = useToast()
  const { getVolumeRulesForProduct, getBogoRulesForProduct, priceRules } = usePriceRules()

  // Discount state
  const [couponCode, setCouponCode] = useState("")
  const [discount, setDiscount] = useState<Discount | null>(null)
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)

  const handleValidateCoupon = useCallback(async () => {
    const code = couponCode.trim()
    if (!code) return

    setIsValidatingCoupon(true)
    try {
      const result = await callEdgeFetch("verify-discount", {
        store_id: STORE_ID,
        code,
      })

      if (result.discount) {
        const cartQuantity = state.items.reduce((sum, i) => sum + i.quantity, 0)
        const validation = validateDiscount(result.discount, state.total, cartQuantity)

        if (!validation.valid) {
          toast({ title: "Código no válido", description: validation.message })
          return
        }

        setDiscount(result.discount)
        try { sessionStorage.setItem("pendingDiscount", code) } catch {}
        toast({ title: "Descuento aplicado", description: `${result.discount.code}` })
      } else {
        toast({ title: "Código no válido", description: result.error || "El código de descuento no existe" })
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "No se pudo verificar el código" })
    } finally {
      setIsValidatingCoupon(false)
    }
  }, [couponCode, state.total, state.items, toast])

  const handleRemoveCoupon = useCallback(() => {
    setDiscount(null)
    setCouponCode("")
    try { sessionStorage.removeItem("pendingDiscount") } catch {}
  }, [])

  const handleCreateCheckout = async () => {
    try {
      try {
        sessionStorage.setItem('checkout_cart', JSON.stringify({ items: state.items, total: state.total }))
      } catch {}

      const discountCode = discount?.code || undefined
      const order = await checkout({ currencyCode, discountCode })

      try {
        sessionStorage.setItem('checkout_order', JSON.stringify(order))
        sessionStorage.setItem('checkout_order_id', String(order.order_id))
      } catch (e) {
        console.error('Error saving to sessionStorage:', e)
      }

      onClose()
      navigate('/pagar')
    } catch (error) {
      console.error('Error in handleCreateCheckout:', error)
    }
  }

  // Calculate adjusted total with volume + bogo discounts
  const adjustedTotal = useMemo(() => {
    let total = 0
    for (const item of state.items) {
      if (item.type === 'bundle') {
        total += item.bundle.bundle_price * item.quantity
      } else {
        if ((item as CartProductItem).isBogoGift) continue
        const basePrice = (item.variant?.price ?? item.product.price) || 0
        const volumeRules = getVolumeRulesForProduct(item.product.id)
        const bogoRules = getBogoRulesForProduct(item.product.id)
        const sp = (item as CartProductItem).sellingPlan || null
        const { unitPrice } = calcItemUnitPrice(basePrice, item.quantity, volumeRules, sp, calcSubscriptionPrice, bogoRules)
        total += unitPrice * item.quantity
      }
    }
    return total
  }, [state.items, getVolumeRulesForProduct, getBogoRulesForProduct])

  const bogoRules = useMemo(() => priceRules.filter(r => r.rule_type === 'bogo'), [priceRules])

  const finalTotal = adjustedTotal

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-96 p-0" aria-describedby="cart-description">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 border-b">
            <SheetTitle className="flex items-center gap-2">
              Shopping Cart
              <Link to="/carrito" onClick={onClose} className="hover:opacity-70 transition-opacity">
                <ExternalLink className="h-4 w-4" />
              </Link>
            </SheetTitle>
            <div id="cart-description" className="sr-only">
              Review and modify the products in your shopping cart
            </div>
          </SheetHeader>

          {state.items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-foreground mb-2">Your cart is empty</h3>
                <p className="text-muted-foreground mb-4">Add some products to start your purchase</p>
                <Button onClick={onClose} variant="outline">Continue Shopping</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="px-6 pt-4 space-y-3">
                <FreeShippingBar cartTotal={state.total} cartQuantity={state.items.reduce((sum, i) => sum + i.quantity, 0)} />
                <BOGOGiftBanner
                  cartItems={state.items as any}
                  bogoRules={bogoRules}
                  onAddGift={(product, variant) => addItem(product, variant, undefined, true)}
                  isProductInCart={(pid) => state.items.some(i => i.type === 'product' && (i as CartProductItem).product.id === pid)}
                />
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {state.items.map((item) => (
                  <Card key={item.key}>
                    <CardContent className="p-4">
                      {item.type === 'bundle' ? (
                        /* --- Bundle Item --- */
                        <div className="flex items-start space-x-3">
                          <div className="w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0 relative">
                            {item.bundle.images?.[0] ? (
                              <img src={item.bundle.images[0]} alt={item.bundle.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <Package className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm text-foreground line-clamp-2">{item.bundle.title}</h4>
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">Paquete</Badge>
                            </div>
                            <p className="text-muted-foreground text-xs mb-2 line-clamp-2">
                              {item.bundleItems.map(bi => `${bi.quantity}x ${bi.product.title}`).join(' + ')}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1">
                                <Button variant="outline" size="icon" onClick={() => updateQuantity(item.key, item.quantity - 1)} className="h-7 w-7">
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="font-medium px-2 text-sm">{item.quantity}</span>
                                <Button variant="outline" size="icon" onClick={() => updateQuantity(item.key, item.quantity + 1)} className="h-7 w-7">
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-sm">
                                  {formatMoney(item.bundle.bundle_price * item.quantity)}
                                </div>
                                {item.bundle.compare_at_price && item.bundle.compare_at_price > item.bundle.bundle_price && (
                                  <div className="text-muted-foreground text-xs line-through">
                                    {formatMoney(item.bundle.compare_at_price * item.quantity)}
                                  </div>
                                )}
                                <Button variant="ghost" size="sm" onClick={() => removeItem(item.key)} className="text-destructive hover:text-destructive p-0 h-auto mt-1">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* --- Product Item --- */
                        <div className="flex items-start space-x-3">
                          <div className="w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                            {(item.product.images && item.product.images.length > 0) || item.variant?.image || item.variant?.image_urls?.length ? (
                              <img src={item.variant?.image_urls?.[0] || item.variant?.image || item.product.images![0]} alt={item.product.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-foreground line-clamp-2">
                              {item.product.title}{item.variant?.title ? ` - ${item.variant.title}` : ''}
                            </h4>
                            {item.type === 'product' && (item as CartProductItem).sellingPlan && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  <RefreshCw className="h-2.5 w-2.5 mr-0.5" />
                                  Suscripción
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  cada {intervalLabel(
                                    (item as CartProductItem).sellingPlan!.interval,
                                    (item as CartProductItem).sellingPlan!.interval_count
                                  )}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-3">
                              {(item as CartProductItem).isBogoGift ? (
                                /* Gift item: no qty controls, show GRATIS */
                                <>
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                    <Gift className="h-2.5 w-2.5 mr-0.5" />
                                    Regalo
                                  </Badge>
                                  <div className="text-right">
                                    <div className="font-semibold text-sm text-accent-foreground">GRATIS</div>
                                    <div className="text-muted-foreground text-xs line-through">
                                      {formatMoney((item.variant?.price ?? item.product.price) || 0)}
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => removeItem(item.key)} className="text-destructive hover:text-destructive p-0 h-auto mt-1">
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </>
                              ) : (
                                /* Regular product */
                                <>
                                  <div className="flex items-center space-x-1">
                                    <Button variant="outline" size="icon" onClick={() => updateQuantity(item.key, item.quantity - 1)} className="h-7 w-7">
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="font-medium px-2 text-sm">{item.quantity}</span>
                                    <Button variant="outline" size="icon" onClick={() => updateQuantity(item.key, item.quantity + 1)} className="h-7 w-7">
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <div className="text-right">
                                    {(() => {
                                      const basePrice = (item.variant?.price ?? item.product.price) || 0
                                      const volumeRules = getVolumeRulesForProduct(item.product.id)
                                      const bogoRulesForItem = getBogoRulesForProduct(item.product.id)
                                      const sp = (item as CartProductItem).sellingPlan || null
                                      const { unitPrice, volumeDiscount, bogoDiscount } = calcItemUnitPrice(basePrice, item.quantity, volumeRules, sp, calcSubscriptionPrice, bogoRulesForItem)
                                      const activeDiscount = volumeDiscount || bogoDiscount
                                      return (
                                        <>
                                          <div className="font-semibold text-sm">
                                            {formatMoney(unitPrice * item.quantity)}
                                          </div>
                                          {activeDiscount && (
                                            <>
                                              <div className="text-muted-foreground text-xs line-through">
                                                {formatMoney(activeDiscount.originalPrice * item.quantity)}
                                              </div>
                                              <span className="text-[10px] text-accent-foreground font-medium">{activeDiscount.savingsLabel}</span>
                                            </>
                                          )}
                                        </>
                                      )
                                    })()}
                                    <Button variant="ghost" size="sm" onClick={() => removeItem(item.key)} className="text-destructive hover:text-destructive p-0 h-auto mt-1">
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="border-t p-6">
                <div className="space-y-3">
                  {/* Discount code input */}
                  {!discount ? (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Código de descuento"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleValidateCoupon()}
                        className="h-9 text-sm"
                        disabled={isValidatingCoupon}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleValidateCoupon}
                        disabled={isValidatingCoupon || !couponCode.trim()}
                        className="shrink-0 h-9"
                      >
                        {isValidatingCoupon ? <Loader2 className="h-3 w-3 animate-spin" /> : "Aplicar"}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-md border border-border bg-secondary/50 px-3 py-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{discount.code}</span>
                        <span className="text-muted-foreground">
                          {discount.discount_type === 'percentage' ? `${discount.value}%` : `$${discount.value}`}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleRemoveCoupon} className="h-auto p-1 text-muted-foreground hover:text-foreground">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}

                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>{formatMoney(finalTotal)}</span>
                  </div>
                </div>
                <Button className="w-full mt-4" size="lg" onClick={handleCreateCheckout} disabled={isCreatingOrder}>
                  {isCreatingOrder ? 'Procesando...' : 'Pagar'}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
