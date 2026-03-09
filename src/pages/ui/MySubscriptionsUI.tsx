import { EcommerceTemplate } from '@/templates/EcommerceTemplate'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import { intervalLabel } from '@/lib/subscription-utils'
import { useSettings } from '@/contexts/SettingsContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw, Pause, Play, XCircle, Package } from 'lucide-react'

interface MySubscriptionsUIProps {
  user: any
  authLoading: boolean
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Activa', variant: 'default' },
  paused: { label: 'Pausada', variant: 'secondary' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
  expired: { label: 'Expirada', variant: 'outline' },
}

export default function MySubscriptionsUI({ user, authLoading }: MySubscriptionsUIProps) {
  const { contracts, loading, pause, resume, cancel } = useSubscriptions(user?.id)
  const { formatMoney } = useSettings()

  if (authLoading) {
    return (
      <EcommerceTemplate pageTitle="Mis Suscripciones">
        <div className="max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </EcommerceTemplate>
    )
  }

  if (!user) {
    return (
      <EcommerceTemplate pageTitle="Mis Suscripciones">
        <div className="text-center py-16">
          <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Inicia sesión</h2>
          <p className="text-muted-foreground">Inicia sesión para ver tus suscripciones.</p>
        </div>
      </EcommerceTemplate>
    )
  }

  return (
    <EcommerceTemplate pageTitle="Mis Suscripciones">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Mis Suscripciones</h1>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-16">
            <RefreshCw className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No tienes suscripciones activas.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {contracts.map((contract) => {
              const plan = contract.selling_plans
              const product = contract.products
              const status = statusConfig[contract.status] || statusConfig.expired

              return (
                <Card key={contract.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Product image */}
                      <div className="w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                        {product?.images?.[0] ? (
                          <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Package className="h-6 w-6" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{product?.title || 'Producto'}</h3>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        {plan && (
                          <p className="text-sm text-muted-foreground">
                            {plan.name} — cada {intervalLabel(plan.interval, plan.interval_count)}
                          </p>
                        )}
                        {contract.next_billing_date && contract.status === 'active' && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Próximo cobro: {new Date(contract.next_billing_date).toLocaleDateString('es-MX')}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 shrink-0">
                        {contract.status === 'active' && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => pause(contract.id)}>
                              <Pause className="h-3.5 w-3.5 mr-1" /> Pausar
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => cancel(contract.id)}>
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Cancelar
                            </Button>
                          </>
                        )}
                        {contract.status === 'paused' && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => resume(contract.id)}>
                              <Play className="h-3.5 w-3.5 mr-1" /> Reanudar
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => cancel(contract.id)}>
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Cancelar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </EcommerceTemplate>
  )
}
