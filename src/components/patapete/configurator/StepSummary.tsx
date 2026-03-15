import { useState } from 'react'
import { Pet, PRICES, Style, STYLE_LABELS } from './types'
import { CanvasPreview } from './CanvasPreview'
import { Button } from '@/components/ui/button'
import { ShoppingCart, ArrowLeft, CheckCircle, ShieldCheck, Clock, Ruler, Leaf } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'

// Real variant IDs from the product
const VARIANT_IDS: Record<1 | 2 | 3, string> = {
  1: '28fc993c-e638-459b-9a00-08abacdc9f32',
  2: '1aee4582-040b-477a-b335-e99446fa76c7',
  3: '5f7e007d-b30e-44c8-baa6-5aa03edb23ad',
}

const PRODUCT_SPECS = [
  { icon: Ruler,  label: '60 × 40 cm' },
  { icon: Leaf,   label: 'Fibra de coco' },
  { icon: Clock,  label: '5-7 días hábiles' },
]

const PROCESS_STEPS = [
  { emoji: '📦', title: 'Recibimos tu pedido', sub: 'Inmediatamente' },
  { emoji: '🎨', title: 'Creamos el diseño', sub: '1-2 días hábiles' },
  { emoji: '📸', title: 'Te enviamos el preview', sub: 'Aprobación tuya' },
  { emoji: '🚚', title: 'Producción y envío', sub: '5-7 días hábiles' },
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
}

export function StepSummary({
  style, petCount, pets, phrase, phrase2, product, finalPreviewDataUrl, onBack
}: StepSummaryProps) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const price = PRICES[style][petCount]
  const variantId = VARIANT_IDS[petCount]
  const variant = product?.variants?.find((v: any) => v.id === variantId)

  const handleAddToCart = () => {
    if (!product) return

    const customization = {
      style: STYLE_LABELS[style],
      petCount,
      pets: pets.slice(0, petCount).map((p, i) => ({
        name: p.name || `Mascota ${i + 1}`,
        ...(p.generatedArtUrl ? { artUrl: p.generatedArtUrl } : {}),
        ...(p.photoPreviewUrl && !p.generatedArtUrl ? { photoUrl: p.photoPreviewUrl } : {}),
      })),
      phrase,
      phrase2,
      previewDataUrl: finalPreviewDataUrl,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem(`patapete_order_${Date.now()}`, JSON.stringify(customization))

    addItem(product, variant)
    setAdded(true)
  }

  const activePets = pets.slice(0, petCount)

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-foreground">¡Tu tapete está listo! 🐾</h2>
        <p className="text-muted-foreground text-sm">Revisa el preview y agrega al carrito para ordenar</p>
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
          <div className="rounded-2xl border border-green-200 bg-green-50/60 dark:bg-green-950/20 dark:border-green-900 p-4 flex gap-3">
            <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-green-800 dark:text-green-300">Garantía Patapete</p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-0.5 leading-relaxed">
                Si el diseño no te convence, lo rehacemos sin costo. Sin preguntas, sin complicaciones.
              </p>
            </div>
          </div>

          {/* Add to cart */}
          {added ? (
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-800 text-sm">¡Tapete agregado al carrito!</p>
                <p className="text-xs text-green-700 mt-0.5">Tu personalización ha sido guardada.</p>
              </div>
            </div>
          ) : (
            <Button
              onClick={handleAddToCart}
              size="lg"
              className="w-full rounded-xl"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Agregar al carrito — ${price.toLocaleString('es-MX')} MXN
            </Button>
          )}

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
              <div className="text-2xl">{step.emoji}</div>
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