import { useMemo } from 'react'
import { useInView } from 'react-intersection-observer'
import { Pet, PRICES, Style } from './types'
import { PhotoPetForm } from './PhotoPetForm'
import { CanvasPreview } from './CanvasPreview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { PenLine, Palette, Star, Shield, Package, Clock, Truck, Eye } from 'lucide-react'

interface StepPetsProps {
  style: Style
  petCount: 1 | 2 | 3
  pets: Pet[]
  phrase: string
  phrase2: string
  onStyleChange: (style: Style) => void
  onPetCountChange: (count: 1 | 2 | 3) => void
  onPetChange: (index: number, updates: Partial<Pet>) => void
  onPhraseChange: (phrase: string) => void
  onPhrase2Change: (phrase2: string) => void
  onGenerate: (petIndex: number, file?: File) => void
  onContinue: () => void
  onOrderNow: () => void
  onPreviewReady: (dataUrl: string) => void
}

// ── Calculates a delivery range of 7-10 business days from today ──
function getDeliveryRange() {
  const addBusinessDays = (date: Date, days: number) => {
    const result = new Date(date)
    let added = 0
    while (added < days) {
      result.setDate(result.getDate() + 1)
      const day = result.getDay()
      if (day !== 0 && day !== 6) added++
    }
    return result
  }
  const now = new Date()
  const from = addBusinessDays(now, 7)
  const to = addBusinessDays(now, 10)
  const fmt = (d: Date) =>
    d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })
  return `${fmt(from)} – ${fmt(to)}`
}

export function StepPets({
  style, petCount, pets, phrase, phrase2,
  onStyleChange, onPetCountChange, onPetChange, onPhraseChange, onPhrase2Change,
  onGenerate, onContinue, onOrderNow, onPreviewReady,
}: StepPetsProps) {
  const isProcessing = pets.some(p => p.isProcessingBg || p.isGeneratingArt)
  const allPhotosUploaded = pets.slice(0, petCount).every(
    p => !!p.photoFile || !!p.photoBase64 || !!p.generatedArtUrl
  )
  const canContinue = !isProcessing && allPhotosUploaded

  const price = PRICES[style][petCount]
  const deliveryRange = useMemo(() => getDeliveryRange(), [])

  // Social proof: stable viewer count (changes every hour, between 8-24)
  const viewerCount = useMemo(() => {
    const seed = Math.floor(Date.now() / 3_600_000)
    return 8 + (seed % 17)
  }, [])

  // Track when the inline CTA button is in viewport
  const { ref: ctaRef, inView: ctaInView } = useInView({ threshold: 0.5 })

  const ctaLabel = isProcessing
    ? 'Generando tu retrato...'
    : canContinue
      ? `Ver resumen — $${price.toLocaleString('es-MX')} MXN →`
      : 'Ver resumen →'

  return (
    <div className="space-y-4">

      {/* ── Product header — title, rating, price ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex">
              {[0,1,2,3,4].map(i => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">4.9</span>{' '}· +500 tapetes entregados
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground leading-tight">
            Tapete personalizado con tu mascota
          </h1>
          <p className="text-muted-foreground text-sm mt-2 leading-relaxed max-w-md">
            Sube la foto de tu mascota y ve cómo queda en tu tapete antes de pedirlo.
          </p>

          {/* Social proof + delivery — below description */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Eye className="w-3.5 h-3.5 text-primary" />
              <span className="font-medium text-foreground">{viewerCount}</span> personas lo están viendo ahora
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Truck className="w-3.5 h-3.5 text-primary" />
              Llega entre <span className="font-medium text-foreground ml-1">{deliveryRange}</span>
            </span>
          </div>
        </div>

        <div className="sm:text-right shrink-0">
          <div className="text-3xl font-bold text-foreground">
            ${price.toLocaleString('es-MX')}
            <span className="text-base font-normal text-muted-foreground ml-1">MXN</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Hecho a pedido en México</p>
        </div>
      </div>

      {/* ── Main layout: 2-col sticky on desktop, single col on mobile ── */}
      {/*    lg:items-start is REQUIRED for sticky to work in a grid        */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-10 lg:items-start">

        {/* ── LEFT: sticky preview — desktop only ── */}
        <div className="hidden lg:block sticky top-20">
          <CanvasPreview
            style={style}
            pets={pets.slice(0, petCount)}
            phrase={phrase}
            phrase2={phrase2}
            onPreviewReady={onPreviewReady}
          />
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-3">
            <span className="bg-muted rounded-lg px-2 py-1">🇲🇽 Hecho en México</span>
            <span className="bg-muted rounded-lg px-2 py-1">📦 Envío a todo el país</span>
            <span className="bg-muted rounded-lg px-2 py-1">⭐ Garantía de satisfacción</span>
          </div>
        </div>

        {/* ── RIGHT: form (mobile: full-width, desktop: right col) ── */}
        <div className="space-y-6">

          {/* MOBILE: sticky preview — first thing visible */}
          <div className="lg:hidden sticky top-16 z-10 -mx-2 px-2 py-2 bg-background/95 backdrop-blur-sm">
            <div className="mx-auto max-w-[75%]">
              <CanvasPreview
                style={style}
                pets={pets.slice(0, petCount)}
                phrase={phrase}
                phrase2={phrase2}
                onPreviewReady={onPreviewReady}
              />
            </div>
          </div>

          {/* Style selector */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">¿Qué estilo prefieres?</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onStyleChange('icono')}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-left',
                  style === 'icono'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40'
                )}
              >
                <Palette className={cn('w-6 h-6', style === 'icono' ? 'text-primary' : 'text-muted-foreground')} />
                <span className="font-semibold text-sm text-foreground">Icono</span>
                <span className="text-xs text-muted-foreground text-center leading-snug">
                  Vector colorido, minimalista
                </span>
              </button>
              <button
                onClick={() => onStyleChange('dibujo')}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-left',
                  style === 'dibujo'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40'
                )}
              >
                <PenLine className={cn('w-6 h-6', style === 'dibujo' ? 'text-primary' : 'text-muted-foreground')} />
                <span className="font-semibold text-sm text-foreground">Dibujo</span>
                <span className="text-xs text-muted-foreground text-center leading-snug">
                  Líneas negras gruesas, estilo sello
                </span>
              </button>
            </div>
          </div>

          {/* Pet count selector */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">¿Cuántas mascotas en el tapete?</Label>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map(count => (
                <button
                  key={count}
                  onClick={() => onPetCountChange(count)}
                  className={cn(
                    'flex-1 py-2.5 px-4 rounded-xl border-2 font-semibold text-sm transition-all',
                    petCount === count
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-foreground hover:border-primary/40'
                  )}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Per-pet forms */}
          {Array.from({ length: petCount }).map((_, i) => (
            <div key={i} className={cn(
              'rounded-2xl border border-border p-4',
              petCount > 1 && 'bg-muted/30'
            )}>
              <PhotoPetForm
                petIndex={i}
                pet={pets[i]}
                onChange={updates => onPetChange(i, updates)}
                onGenerate={file => onGenerate(i, file ?? undefined)}
              />
            </div>
          ))}

          {/* Phrase inputs */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="phrase" className="text-sm font-semibold">
                Texto superior <span className="font-normal text-muted-foreground">(encima de la mascota, opcional)</span>
              </Label>
              <Input
                id="phrase"
                placeholder='Aquí manda'
                value={phrase}
                onChange={e => onPhraseChange(e.target.value)}
                maxLength={40}
                className="rounded-xl"
              />
              {phrase && (
                <p className="text-xs text-muted-foreground">{40 - phrase.length} caracteres restantes</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phrase2" className="text-sm font-semibold">
                Texto inferior <span className="font-normal text-muted-foreground">(debajo de la mascota, opcional)</span>
              </Label>
              <Input
                id="phrase2"
                placeholder='No toques... ya sabemos que estás aquí'
                value={phrase2}
                onChange={e => onPhrase2Change(e.target.value)}
                maxLength={40}
                className="rounded-xl"
              />
              {phrase2 && (
                <p className="text-xs text-muted-foreground">{40 - phrase2.length} caracteres restantes</p>
              )}
            </div>
          </div>

          {/* ── CTA section ── */}
          <div className="space-y-3" ref={ctaRef}>
            {/* Primary CTA */}
            <Button
              onClick={onOrderNow}
              disabled={!canContinue}
              className="w-full rounded-xl"
              size="lg"
            >
              {isProcessing
                ? 'Generando tu retrato...'
                : `¡Ordenar ahora! — $${price.toLocaleString('es-MX')} MXN →`}
            </Button>

            {/* Secondary CTA */}
            <Button
              onClick={onContinue}
              disabled={!canContinue}
              variant="outline"
              className="w-full rounded-xl"
              size="lg"
            >
              Ver mi tapete primero
            </Button>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Shield, label: 'Pago seguro' },
                { icon: Package, label: 'Envío incluido' },
                { icon: Clock,  label: 'Garantía total' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1 rounded-xl border border-border bg-muted/30 py-2.5 px-2 text-center">
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-[11px] text-muted-foreground leading-tight">{label}</span>
                </div>
              ))}
            </div>

            {!allPhotosUploaded && (
              <p className="text-xs text-center text-muted-foreground">
                Sube la foto de {petCount === 1 ? 'tu mascota' : 'todas tus mascotas'} para continuar
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Sticky CTA bar — only when canContinue and button is out of view ── */}
      {canContinue && (
        <div
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50 bg-background/97 backdrop-blur-md border-t shadow-lg transition-all duration-300 ease-out pb-[env(safe-area-inset-bottom)]',
            ctaInView ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
          )}
        >
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="hidden sm:flex">
                {[0,1,2,3,4].map(i => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">Tapete personalizado</p>
                <p className="text-xs text-muted-foreground hidden sm:block">¡Tu retrato está listo!</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-lg font-bold text-foreground">
                ${price.toLocaleString('es-MX')}
                <span className="text-xs font-normal text-muted-foreground ml-1">MXN</span>
              </span>
              <Button
                onClick={onContinue}
                size="default"
                variant="outline"
                className="rounded-xl font-semibold px-4 hidden sm:flex"
              >
                Ver tapete
              </Button>
              <Button
                onClick={onOrderNow}
                size="default"
                className="rounded-xl font-semibold px-5"
              >
                Ordenar →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}