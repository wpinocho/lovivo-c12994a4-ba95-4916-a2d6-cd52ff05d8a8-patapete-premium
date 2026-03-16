import { useMemo, useState, useRef } from 'react'
import { useInView } from 'react-intersection-observer'
import { Pet, PRICES, Style } from './types'
import { PhotoPetForm } from './PhotoPetForm'
import { CanvasPreview } from './CanvasPreview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { PenLine, Palette, Star, Shield, Package, Clock, Truck, Eye, ShoppingCart, ShieldCheck, CheckCircle, Scissors, Home } from 'lucide-react'

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
  onAddToCart: () => void
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
  onGenerate, onAddToCart, onOrderNow, onPreviewReady,
}: StepPetsProps) {
  const isProcessing = pets.some(p => p.isProcessingBg || p.isGeneratingArt)

  // ── Validation state ──
  const [fieldErrors, setFieldErrors] = useState<{
    [petIndex: number]: { photo?: string; name?: string }
  }>({})
  const petRefs = useRef<(HTMLDivElement | null)[]>([null, null, null])

  function validateAndProceed(action: 'order' | 'cart') {
    if (isProcessing) return
    const errors: typeof fieldErrors = {}
    let firstErrorIndex = -1
    for (let i = 0; i < petCount; i++) {
      const pet = pets[i]
      const hasPhoto = !!pet.photoFile || !!pet.photoBase64 || !!pet.generatedArtUrl
      const hasName = !!pet.name?.trim()
      if (!hasPhoto || !hasName) {
        errors[i] = {}
        if (!hasPhoto) errors[i].photo = 'Sube la foto de tu mascota para continuar'
        if (!hasName) errors[i].name = 'Escribe el nombre de tu mascota'
        if (firstErrorIndex === -1) firstErrorIndex = i
      }
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      if (firstErrorIndex >= 0 && petRefs.current[firstErrorIndex]) {
        petRefs.current[firstErrorIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }
    setFieldErrors({})
    if (action === 'order') onOrderNow()
    else onAddToCart()
  }

  // Wrapper for onPetChange that clears errors when the user fixes a field
  function handlePetChange(index: number, updates: Partial<typeof pets[0]>) {
    onPetChange(index, updates)
    if (fieldErrors[index]) {
      const updated = { ...fieldErrors[index] }
      const hasPhotoUpdate = 'photoFile' in updates || 'photoBase64' in updates || 'generatedArtUrl' in updates
      const hasNameUpdate = 'name' in updates
      if (hasPhotoUpdate) delete updated.photo
      if (hasNameUpdate) delete updated.name
      if (Object.keys(updated).length === 0) {
        const newErrors = { ...fieldErrors }
        delete newErrors[index]
        setFieldErrors(newErrors)
      } else {
        setFieldErrors({ ...fieldErrors, [index]: updated })
      }
    }
  }

  const price = PRICES[style][petCount]
  const deliveryRange = useMemo(() => getDeliveryRange(), [])

  // Social proof: stable viewer count (changes every hour, between 8-24)
  const viewerCount = useMemo(() => {
    const seed = Math.floor(Date.now() / 3_600_000)
    return 8 + (seed % 17)
  }, [])

  // Track when the inline CTA button is in viewport
  const { ref: ctaRef, inView: ctaInView } = useInView({ threshold: 0.5 })

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
            <div
              key={i}
              ref={el => { petRefs.current[i] = el }}
              className={cn(
                'rounded-2xl border p-4 transition-colors',
                fieldErrors[i] ? 'border-destructive/50 bg-destructive/5' : 'border-border',
                petCount > 1 && !fieldErrors[i] && 'bg-muted/30'
              )}
            >
              <PhotoPetForm
                petIndex={i}
                pet={pets[i]}
                onChange={updates => handlePetChange(i, updates)}
                onGenerate={file => onGenerate(i, file ?? undefined)}
                photoError={fieldErrors[i]?.photo}
                nameError={fieldErrors[i]?.name}
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
            {/* Primary CTA: Order now */}
            <Button
              onClick={() => validateAndProceed('order')}
              disabled={isProcessing}
              className="w-full rounded-xl"
              size="lg"
            >
              {isProcessing
                ? 'Generando tu retrato...'
                : `⚡ ¡Ordenar ahora! — $${price.toLocaleString('es-MX')} MXN →`}
            </Button>

            {/* Secondary CTA: Add to cart */}
            <Button
              onClick={() => validateAndProceed('cart')}
              disabled={isProcessing}
              variant="outline"
              className="w-full rounded-xl"
              size="lg"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Agregar al carrito
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

            {/* Guarantee */}
            <div className="rounded-xl border border-border bg-secondary/30 p-3 flex gap-2.5">
              <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-foreground">Garantía Patapete</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Si tu tapete llega con cualquier defecto de fabricación, lo reponemos sin costo. Sin preguntas.
                </p>
              </div>
            </div>

            {/* What happens next */}
            <div className="border border-border rounded-xl p-4 bg-muted/20 space-y-3">
              <p className="text-xs font-bold text-foreground text-center">¿Qué pasa después de ordenar?</p>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { icon: CheckCircle, title: 'Orden confirmada', sub: 'Empezamos producción' },
                  { icon: Scissors,    title: 'Fabricamos tu tapete', sub: '3–5 días hábiles' },
                  { icon: Truck,       title: 'Lo enviamos', sub: 'Número de rastreo por correo' },
                  { icon: Home,        title: 'Llega a tu puerta', sub: '7–10 días desde la compra' },
                ].map(({ icon: Icon, title, sub }, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Icon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-foreground leading-tight">{title}</p>
                      <p className="text-xs text-muted-foreground">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky CTA bar — appears when CTA button is out of view ── */}
      {!isProcessing && (
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
                onClick={() => validateAndProceed('cart')}
                size="default"
                variant="outline"
                className="rounded-xl font-semibold px-4 hidden sm:flex"
              >
                <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
                Agregar al carrito
              </Button>
              <Button
                onClick={() => validateAndProceed('order')}
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