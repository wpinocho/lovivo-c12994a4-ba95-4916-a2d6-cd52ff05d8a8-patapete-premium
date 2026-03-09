/**
 * EDITABLE UI COMPONENT - MyOrdersUI
 * TIPO B - El agente de IA puede editar libremente este componente
 */

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { EcommerceTemplate } from '@/templates/EcommerceTemplate'
import { HeadlessMyOrders } from '@/components/headless/HeadlessMyOrders'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AuthDialog } from '@/components/AuthDialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Package, Calendar, RefreshCw, ShoppingBag, AlertCircle, LogIn, ChevronDown, MapPin, Tag } from 'lucide-react'
import { formatMoney } from '@/lib/money'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface MyOrdersUIProps {
  user: User | null
  authLoading: boolean
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  processing: { label: 'En proceso', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  completed: { label: 'Completado', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  shipped: { label: 'Enviado', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800 border-red-200' },
  refunded: { label: 'Reembolsado', className: 'bg-purple-100 text-purple-800 border-purple-200' },
  paid: { label: 'Pagado', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
}

function getStatusBadge(status: string) {
  const mapped = STATUS_MAP[status] || { label: status, className: 'bg-muted text-muted-foreground' }
  return <Badge variant="outline" className={cn('text-xs font-medium', mapped.className)}>{mapped.label}</Badge>
}

function formatAddress(addr: any): string | null {
  if (!addr) return null
  if (typeof addr === 'string') return addr
  const parts = [addr.address1, addr.address2, addr.city, addr.state, addr.zip, addr.country].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : null
}

function OrderSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function OrderCard({ order }: { order: any }) {
  const [open, setOpen] = useState(false)
  const items = order.order_items || []
  const currency = order.currency_code || 'USD'

  // Thumbnails: first image of each product (max 4)
  const thumbnails = items
    .map((item: any) => item.products?.images?.[0])
    .filter(Boolean)
    .slice(0, 4)

  const address = formatAddress(order.shipping_address)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <CollapsibleTrigger asChild>
          <button className="w-full text-left p-4 focus:outline-none">
            <div className="flex items-center justify-between gap-3">
              {/* Thumbnails */}
              <div className="flex -space-x-2 shrink-0">
                {thumbnails.length > 0 ? thumbnails.map((img: string, i: number) => (
                  <img
                    key={i}
                    src={img}
                    alt=""
                    className="h-12 w-12 rounded-lg border-2 border-background object-cover"
                  />
                )) : (
                  <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">
                    #{order.order_number || order.id?.slice(0, 8)}
                  </span>
                  {getStatusBadge(order.status)}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(order.created_at), "d MMM yyyy", { locale: es })}
                  </span>
                  <span className="font-medium text-foreground">
                    {formatMoney(order.total_amount || 0, currency)}
                  </span>
                  <span>{items.length} {items.length === 1 ? 'producto' : 'productos'}</span>
                </div>
              </div>

              {/* Chevron */}
              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground transition-transform shrink-0",
                open && "rotate-180"
              )} />
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t px-4 pb-4 pt-3 space-y-4">
            {/* Product list */}
            <div className="space-y-3">
              {items.map((item: any, idx: number) => {
                const product = item.products
                const img = product?.images?.[0]
                const hasDiscount = product?.compare_at_price && product.compare_at_price > item.price

                return (
                  <div key={idx} className="flex gap-3 items-start">
                    {img ? (
                      <img src={img} alt={product?.title || ''} className="h-16 w-16 rounded-lg object-cover border" />
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center border">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight truncate">{product?.title || 'Producto'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Cant: {item.quantity}</p>
                      {hasDiscount && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Tag className="h-3 w-3 text-emerald-600" />
                          <span className="text-xs text-emerald-600 font-medium">Descuento aplicado</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{formatMoney(item.total || item.price * item.quantity, currency)}</p>
                      {hasDiscount && (
                        <p className="text-xs text-muted-foreground line-through">
                          {formatMoney(product.compare_at_price * item.quantity, currency)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Order summary */}
            <div className="border-t pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatMoney(order.subtotal || 0, currency)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Descuento</span>
                  <span>-{formatMoney(order.discount_amount, currency)}</span>
                </div>
              )}
              {order.shipping_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Envío</span>
                  <span>{formatMoney(order.shipping_amount, currency)}</span>
                </div>
              )}
              {order.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Impuestos</span>
                  <span>{formatMoney(order.tax_amount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base pt-1 border-t">
                <span>Total</span>
                <span>{formatMoney(order.total_amount || 0, currency)}</span>
              </div>
            </div>

            {/* Shipping address */}
            {address && (
              <div className="border-t pt-3">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Dirección de envío</p>
                    <p className="text-sm">{address}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

export default function MyOrdersUI({ user, authLoading }: MyOrdersUIProps) {
  const navigate = useNavigate()
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  return (
    <EcommerceTemplate layout="centered">
      <div className="py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Mis Pedidos</h1>
          <p className="text-sm text-muted-foreground mt-1">Historial de compras</p>
        </div>

        {authLoading ? (
          <OrderSkeleton />
        ) : !user ? (
          <Card className="border-dashed">
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <div className="rounded-full bg-muted p-5 inline-flex">
                  <LogIn className="h-10 w-10 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Inicia sesión para ver tus pedidos</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Necesitas una cuenta para ver tu historial de compras.
                  </p>
                </div>
                <Button size="lg" onClick={() => setShowAuthDialog(true)}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Iniciar Sesión
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <HeadlessMyOrders>
            {({ orders, loading, error, refetch }) => {
              if (loading) return <OrderSkeleton />

              if (error) {
                return (
                  <Card className="border-destructive/50 bg-destructive/5">
                    <CardContent className="py-8">
                      <div className="text-center space-y-3">
                        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
                        <p className="text-sm text-muted-foreground">No pudimos cargar tus pedidos.</p>
                        <Button onClick={refetch} variant="outline" size="sm">
                          <RefreshCw className="mr-2 h-3 w-3" />
                          Reintentar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              }

              if (orders.length === 0) {
                return (
                  <Card className="border-dashed">
                    <CardContent className="py-12">
                      <div className="text-center space-y-4">
                        <div className="rounded-full bg-muted p-5 inline-flex">
                          <Package className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">Aún no tienes pedidos</h3>
                          <p className="text-muted-foreground text-sm mt-1">
                            Cuando realices una compra aparecerá aquí.
                          </p>
                        </div>
                        <Button size="lg" onClick={() => navigate('/')}>
                          <ShoppingBag className="mr-2 h-4 w-4" />
                          Ir a la tienda
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              }

              return (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              )
            }}
          </HeadlessMyOrders>
        )}
      </div>

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </EcommerceTemplate>
  )
}
