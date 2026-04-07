import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BrandLogoLeft } from '@/components/BrandLogoLeft'
import { Copy, Check, ExternalLink, Clock, Store, Building2 } from 'lucide-react'

interface PendingPaymentData {
  method: 'oxxo' | 'spei'
  // OXXO
  reference?: string
  hosted_voucher_url?: string
  expires_at?: number
  // SPEI
  clabe?: string
  bank_name?: string
  hosted_instructions_url?: string
  // Common
  amount: number
  currency: string
  order_id?: string
}

function OxxoInstructions({ data }: { data: PendingPaymentData }) {
  const [copied, setCopied] = useState(false)

  const copyRef = async () => {
    if (!data.reference) return
    await navigator.clipboard.writeText(data.reference)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const expiryDate = data.expires_at
    ? new Date(data.expires_at * 1000).toLocaleDateString('es-MX', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    : null

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
          <Store className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">¡Tu voucher está listo!</h1>
        <p className="text-muted-foreground">Paga en cualquier tienda OXXO para confirmar tu pedido</p>
      </div>

      {/* Reference card */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Referencia OXXO</p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold tracking-widest flex-1 break-all">
                {data.reference || '—'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={copyRef}
                className="shrink-0 gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
          </div>

          <div className="h-px bg-border" />

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Monto a pagar</span>
            <span className="font-bold text-lg">
              ${data.amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {data.currency}
            </span>
          </div>

          {expiryDate && (
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <Clock className="w-4 h-4 shrink-0" />
              <span>Vence el {expiryDate}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CTA */}
      {data.hosted_voucher_url && (
        <Button
          className="w-full gap-2"
          size="lg"
          onClick={() => window.open(data.hosted_voucher_url, '_blank')}
        >
          <ExternalLink className="w-4 h-4" />
          Ver voucher OXXO
        </Button>
      )}

      <p className="text-xs text-center text-muted-foreground">
        Recibirás un correo de confirmación cuando recibamos tu pago. El pago puede tardar hasta 1 hora en procesarse.
      </p>
    </div>
  )
}

function SpeiInstructions({ data }: { data: PendingPaymentData }) {
  const [copied, setCopied] = useState(false)

  const copyClabe = async () => {
    if (!data.clabe) return
    await navigator.clipboard.writeText(data.clabe)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <Building2 className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Realiza tu transferencia SPEI</h1>
        <p className="text-muted-foreground">Usa la CLABE interbancaria desde tu banco o app bancaria</p>
      </div>

      {/* CLABE card */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">CLABE interbancaria</p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold tracking-widest flex-1 break-all">
                {data.clabe || '—'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={copyClabe}
                className="shrink-0 gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
          </div>

          {data.bank_name && (
            <>
              <div className="h-px bg-border" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Banco</span>
                <span className="font-medium">{data.bank_name}</span>
              </div>
            </>
          )}

          <div className="h-px bg-border" />

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Monto exacto</span>
            <span className="font-bold text-lg">
              ${data.amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {data.currency}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <Clock className="w-4 h-4 shrink-0" />
            <span>Transferencia confirmada en 30 min – 4 horas</span>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      {data.hosted_instructions_url && (
        <Button
          className="w-full gap-2"
          size="lg"
          onClick={() => window.open(data.hosted_instructions_url, '_blank')}
        >
          <ExternalLink className="w-4 h-4" />
          Ver instrucciones completas
        </Button>
      )}

      <p className="text-xs text-center text-muted-foreground">
        Recibirás un correo de confirmación cuando detectemos tu pago. Transfiere el monto exacto para evitar demoras.
      </p>
    </div>
  )
}

export default function PendingPayment() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<PendingPaymentData | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('pending_payment')
    if (raw) {
      try {
        setData(JSON.parse(raw))
      } catch { /* ignore */ }
    }
  }, [])

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground text-center">Información de pago no encontrada.</p>
        <Button variant="outline" onClick={() => navigate('/')}>Ir al inicio</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <BrandLogoLeft />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-10">
        {data.method === 'oxxo' && <OxxoInstructions data={data} />}
        {data.method === 'spei' && <SpeiInstructions data={data} />}

        <div className="mt-8 text-center">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            Volver a la tienda
          </Button>
        </div>
      </main>
    </div>
  )
}