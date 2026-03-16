import { Pet, PRICES, Style, STYLE_LABELS } from './types'
import { CanvasPreview } from './CanvasPreview'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ShieldCheck, Clock, Ruler, Leaf, Zap, CheckCircle, Scissors, Truck, Home } from 'lucide-react'

const PRODUCT_SPECS = [
  { icon: Ruler,  label: '60 × 40 cm' },
  { icon: Leaf,   label: 'Fibra de coco' },
  { icon: Clock,  label: '5-7 días hábiles' },
]

const PROCESS_STEPS = [
  { icon: CheckCircle, title: 'Orden confirmada',     sub: 'Empezamos producción' },
  { icon: Scissors,    title: 'Fabricamos tu tapete', sub: '3–5 días hábiles' },
  { icon: Truck,       title: 'Lo enviamos',          sub: 'Número de rastreo por correo' },
  { icon: Home,        title: 'Llega a tu puerta',    sub: '7–10 días desde la compra' },
]

interface StepSummaryProps {
  style: Style
  petCount: 1 | 2 | 3
  pets: Pet[]
  phrase: string
  phrase2: string
  product: any
  finalPreviewDataUrl: string | null
  onBack: () => void
  onOrderNow: () => void
}

export function StepSummary({
  style, petCount, pets, phrase, phrase2, product, finalPreviewDataUrl, onBack, onOrderNow
}: StepSummaryProps) {
  const price = PRICES[style][petCount]

  const activePets = pets.slice(0, petCount)

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-foreground">¡Tu tapete está listo! 🐾</h2>
        <p className="text-muted-foreground text-sm">Revisa que todo esté perfecto antes de confirmar tu pedido</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Preview */}
        <div className="space-y-3">
          <CanvasPreview
            style={style}
            pets={activePets}
            phrase={phrase}
            phrase2={phrase2}
          />
          <p className="text-xs text-center text-muted-foreground">
            * Preview orientativo. El diseño final puede variar ligeramente.
          </p>

          {/* Specs strip */}
          <div className="flex justify-center gap-4 flex-wrap pt-1">
            {PRODUCT_SPECS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon className="w-3.5 h-3.5 text-primary/70 flex-shrink-0" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4">
          {/* Order summary card */}
          <div className="rounded-2xl border border-border p-5 space-y-4 bg-card">
            <h3 className="font-bold text-foreground">Resumen del pedido</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estilo</span>
                <span className="font-semibold text-foreground">{STYLE_LABELS[style]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mascotas</span>
                <span className="font-semibold text-foreground">{petCount} {petCount === 1 ? 'mascota' : 'mascotas'}</span>
              </div>
              {activePets.map((p, i) => p.name && (
                <div key={i} className="flex justify-between">
                  <span className="text-muted-foreground">Mascota {i + 1}</span>
                  <span className="font-medium text-foreground">{p.name}</span>
                </div>
              ))}
              {phrase && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Texto superior</span>
                  <span className="font-medium text-foreground italic">"{phrase}"</span>
                </div>
              )}
              {phrase2 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Texto inferior</span>
                  <span className="font-medium text-foreground italic">"{phrase2}"</span>
                </div>
              )}
            </div>

            <div className="border-t border-border pt-3 flex justify-between items-center">
              <span className="font-semibold text-foreground">Total</span>
              <span className="text-2xl font-bold text-foreground">
                ${price.toLocaleString('es-MX')}{' '}
                <span className="text-sm font-normal text-muted-foreground">MXN</span>
              </span>
            </div>
          </div>

          {/* Guarantee card */}
          <div className="rounded-2xl border border-border bg-secondary/30 p-4 flex gap-3">
            <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-foreground">Garantía Patapete</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Si tu tapete llega con cualquier defecto de fabricación, lo reponemos sin costo. Sin preguntas, sin complicaciones.
              </p>
            </div>
          </div>

          {/* Order CTA */}
          <Button
            onClick={onOrderNow}
            size="lg"
            className="w-full rounded-xl"
          >
            <Zap className="mr-2 h-5 w-5" />
            ¡Ordenar ahora! — ${price.toLocaleString('es-MX')} MXN
          </Button>

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { icon: '🚚', text: 'Envío a toda la República' },
              { icon: '🇲🇽', text: 'Hecho a mano en México' },
              { icon: '📸', text: 'Preview antes de producir' },
              { icon: '🔒', text: 'Pago 100% seguro' },
            ].map(badge => (
              <div key={badge.text} className="flex items-center gap-1.5 bg-muted/50 rounded-xl px-2.5 py-2">
                <span>{badge.icon}</span>
                <span className="text-muted-foreground">{badge.text}</span>
              </div>
            ))}
          </div>

          <button
            onClick={onBack}
            className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a configurar
          </button>
        </div>
      </div>

      {/* "Qué pasa después" timeline */}
      <div className="border border-border rounded-2xl p-5 bg-muted/20 space-y-4">
        <p className="text-sm font-bold text-foreground text-center">¿Qué pasa después de ordenar?</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PROCESS_STEPS.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-1.5">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <step.icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs font-semibold text-foreground leading-tight">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.sub}</p>
              {i < PROCESS_STEPS.length - 1 && (
                <div className="hidden sm:block absolute" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}