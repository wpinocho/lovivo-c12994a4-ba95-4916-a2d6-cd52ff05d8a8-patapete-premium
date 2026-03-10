import { Pet, Style, PRICES } from './types'
import { PhotoPetForm } from './PhotoPetForm'
import { CanvasPreview } from './CanvasPreview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Sparkles, Pen } from 'lucide-react'

const STYLE_OPTIONS: { id: Style; label: string; tagline: string; icon: React.ReactNode; featured?: boolean }[] = [
  {
    id: 'tattoo',
    label: 'Tatuaje IA',
    tagline: '⭐ Más popular',
    icon: <Sparkles className="w-4 h-4" />,
    featured: true,
  },
  {
    id: 'vector',
    label: 'Vector',
    tagline: 'Moderno y minimalista',
    icon: <Pen className="w-4 h-4" />,
  },
]

interface StepPetsProps {
  style: Style
  petCount: 1 | 2 | 3
  pets: Pet[]
  phrase: string
  onStyleChange: (style: Style) => void
  onPetCountChange: (count: 1 | 2 | 3) => void
  onPetChange: (index: number, updates: Partial<Pet>) => void
  onPhraseChange: (phrase: string) => void
  onGenerate: (petIndex: number) => void
  onContinue: () => void
  onPreviewReady: (dataUrl: string) => void
}

export function StepPets({
  style, petCount, pets, phrase,
  onStyleChange, onPetCountChange, onPetChange, onPhraseChange,
  onGenerate, onContinue, onPreviewReady,
}: StepPetsProps) {
  const isProcessing = pets.some(p => p.isProcessingBg || p.isGeneratingArt)
  const allPhotosUploaded = pets.slice(0, petCount).every(p => !!p.photoFile)
  const canContinue = !isProcessing && allPhotosUploaded

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-foreground">Configura tu tapete</h2>
        <p className="text-muted-foreground text-sm">Personaliza cada detalle de tu tapete único</p>
      </div>

      {/* Desktop: 2-column layout */}
      <div className="flex flex-col-reverse lg:grid lg:grid-cols-2 lg:gap-8 gap-6">

        {/* LEFT: Canvas preview */}
        <div className="space-y-3">
          <div className="hidden lg:block">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Preview en vivo</p>
            <CanvasPreview
              style={style}
              pets={pets.slice(0, petCount)}
              phrase={phrase}
              onPreviewReady={onPreviewReady}
            />
          </div>
          <div className="hidden lg:flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="bg-muted rounded-lg px-2 py-1">🇲🇽 Hecho en México</span>
            <span className="bg-muted rounded-lg px-2 py-1">📦 Envío a todo el país</span>
            <span className="bg-muted rounded-lg px-2 py-1">⭐ Garantía de satisfacción</span>
          </div>
        </div>

        {/* RIGHT: Form */}
        <div className="space-y-6">

          {/* Style selector */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Elige el estilo de tu tapete</Label>
            <div className="grid grid-cols-2 gap-3">
              {STYLE_OPTIONS.map(opt => {
                const isSelected = style === opt.id
                return (
                  <button
                    key={opt.id}
                    onClick={() => onStyleChange(opt.id)}
                    className={cn(
                      'relative text-left rounded-xl border-2 p-3.5 transition-all duration-200',
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-card hover:border-primary/40'
                    )}
                  >
                    {opt.featured && !isSelected && (
                      <span className="absolute top-2 right-2 text-[10px] font-bold bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded-full">
                        Popular
                      </span>
                    )}
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center mb-2 transition-colors',
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}>
                      {opt.icon}
                    </div>
                    <p className="font-bold text-sm text-foreground">{opt.label}</p>
                    <p className={cn(
                      'text-xs mt-0.5',
                      opt.featured ? 'text-amber-600' : 'text-muted-foreground'
                    )}>
                      {opt.tagline}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5 font-medium">
                      Desde ${PRICES[opt.id][1].toLocaleString('es-MX')} MXN
                    </p>
                  </button>
                )
              })}
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
                style={style}
                pet={pets[i]}
                onChange={updates => onPetChange(i, updates)}
                onGenerate={() => onGenerate(i)}
              />
            </div>
          ))}

          {/* Mobile: Canvas preview */}
          <div className="lg:hidden space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Preview</p>
            <CanvasPreview
              style={style}
              pets={pets.slice(0, petCount)}
              phrase={phrase}
              onPreviewReady={onPreviewReady}
            />
          </div>

          {/* Phrase input */}
          <div className="space-y-1.5">
            <Label htmlFor="phrase" className="text-sm font-semibold">
              Frase para el tapete <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="phrase"
              placeholder='Ej: "Bienvenido a casa", "Hogar dulce hogar"...'
              value={phrase}
              onChange={e => onPhraseChange(e.target.value)}
              maxLength={40}
              className="rounded-xl"
            />
            {phrase && (
              <p className="text-xs text-muted-foreground">{40 - phrase.length} caracteres restantes</p>
            )}
          </div>

          {/* Continue button */}
          <Button
            onClick={onContinue}
            disabled={!canContinue}
            className="w-full rounded-xl"
            size="lg"
          >
            {isProcessing ? 'Procesando...' : 'Ver resumen →'}
          </Button>

          {!allPhotosUploaded && (
            <p className="text-xs text-center text-muted-foreground">
              Sube la foto de {petCount === 1 ? 'tu mascota' : 'todas tus mascotas'} para continuar
            </p>
          )}
        </div>
      </div>
    </div>
  )
}