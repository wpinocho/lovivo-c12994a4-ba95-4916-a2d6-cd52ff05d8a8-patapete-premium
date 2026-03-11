import { useState } from 'react'
import { Pet, PRICES } from './types'
import { CanvasPreview } from './CanvasPreview'
import { Button } from '@/components/ui/button'
import { ShoppingCart, ArrowLeft, CheckCircle } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'

// Real variant IDs from the product (tattoo style only)
const VARIANT_IDS: Record<1 | 2 | 3, string> = {
  1: '28fc993c-e638-459b-9a00-08abacdc9f32',
  2: '1aee4582-040b-477a-b335-e99446fa76c7',
  3: '5f7e007d-b30e-44c8-baa6-5aa03edb23ad',
}

interface StepSummaryProps {
  petCount: 1 | 2 | 3
  pets: Pet[]
  phrase: string
  product: any
  finalPreviewDataUrl: string | null
  onBack: () => void
}

export function StepSummary({
  petCount, pets, phrase, product, finalPreviewDataUrl, onBack
}: StepSummaryProps) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const price = PRICES['tattoo'][petCount]
  const variantId = VARIANT_IDS[petCount]
  const variant = product?.variants?.find((v: any) => v.id === variantId)

  const handleAddToCart = () => {
    if (!product) return

    const customization = {
      style: 'Retrato IA',
      petCount,
      pets: pets.slice(0, petCount).map((p, i) => ({
        name: p.name || `Mascota ${i + 1}`,
        ...(p.generatedArtUrl ? { artUrl: p.generatedArtUrl } : {}),
        ...(p.photoPreviewUrl && !p.generatedArtUrl ? { photoUrl: p.photoPreviewUrl } : {}),
      })),
      phrase,
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
        <div className="space-y-2">
          <CanvasPreview
            style="tattoo"
            pets={activePets}
            phrase={phrase}
          />
          <p className="text-xs text-center text-muted-foreground">
            * Preview orientativo. El diseño final puede variar ligeramente.
          </p>
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-border p-5 space-y-4 bg-card">
            <h3 className="font-bold text-foreground">Resumen del pedido</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Arte</span>
                <span className="font-semibold text-foreground">Retrato IA</span>
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
                  <span className="text-muted-foreground">Texto</span>
                  <span className="font-medium text-foreground italic">"{phrase}"</span>
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

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { icon: '🚚', text: 'Envío a toda la República' },
              { icon: '🇲🇽', text: 'Hecho a mano en México' },
              { icon: '⭐', text: 'Garantía de satisfacción' },
              { icon: '📸', text: 'Preview antes de producir' },
            ].map(badge => (
              <div key={badge.text} className="flex items-center gap-1.5 bg-muted/50 rounded-xl px-2.5 py-2">
                <span>{badge.icon}</span>
                <span className="text-muted-foreground">{badge.text}</span>
              </div>
            ))}
          </div>

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

          <button
            onClick={onBack}
            className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a configurar
          </button>
        </div>
      </div>
    </div>
  )
}