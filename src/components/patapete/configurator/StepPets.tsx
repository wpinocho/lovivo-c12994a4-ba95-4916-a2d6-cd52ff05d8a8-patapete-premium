import { Pet, Style } from './types'
import { IconPetForm } from './IconPetForm'
import { PhotoPetForm } from './PhotoPetForm'
import { CanvasPreview } from './CanvasPreview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface StepPetsProps {
  style: Style
  petCount: 1 | 2 | 3
  pets: Pet[]
  phrase: string
  onPetCountChange: (count: 1 | 2 | 3) => void
  onPetChange: (index: number, updates: Partial<Pet>) => void
  onPhraseChange: (phrase: string) => void
  onGenerate: (petIndex: number) => void
  onContinue: () => void
  onPreviewReady: (dataUrl: string) => void
}

export function StepPets({
  style, petCount, pets, phrase,
  onPetCountChange, onPetChange, onPhraseChange,
  onGenerate, onContinue, onPreviewReady,
}: StepPetsProps) {
  const isProcessing = pets.some(p => p.isProcessingBg || p.isGeneratingArt)
  const allPhotosUploaded = style !== 'icon'
    ? pets.slice(0, petCount).every(p => !!p.photoFile)
    : true

  const canContinue = !isProcessing && allPhotosUploaded

  const styleLabel = style === 'icon' ? 'Ícono de Raza' : style === 'tattoo' ? 'Tatuaje IA' : 'Vector'

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-foreground">Configura tu tapete</h2>
        <p className="text-muted-foreground text-sm">Estilo: <span className="font-semibold text-foreground">{styleLabel}</span></p>
      </div>

      {/* Desktop: 2-column layout */}
      <div className="flex flex-col-reverse lg:grid lg:grid-cols-2 lg:gap-8 gap-6">

        {/* LEFT: Canvas preview (desktop) */}
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
          {/* Trust badges */}
          <div className="hidden lg:flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="bg-muted rounded-lg px-2 py-1">🇲🇽 Hecho en México</span>
            <span className="bg-muted rounded-lg px-2 py-1">📦 Envío a todo el país</span>
            <span className="bg-muted rounded-lg px-2 py-1">⭐ Garantía de satisfacción</span>
          </div>
        </div>

        {/* RIGHT: Form */}
        <div className="space-y-6">
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
              {style === 'icon' ? (
                <IconPetForm
                  petIndex={i}
                  pet={pets[i]}
                  onChange={updates => onPetChange(i, updates)}
                />
              ) : (
                <PhotoPetForm
                  petIndex={i}
                  style={style}
                  pet={pets[i]}
                  onChange={updates => onPetChange(i, updates)}
                  onGenerate={() => onGenerate(i)}
                />
              )}
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

          {style !== 'icon' && !allPhotosUploaded && (
            <p className="text-xs text-center text-muted-foreground">
              Sube la foto de {petCount === 1 ? 'tu mascota' : 'todas tus mascotas'} para continuar
            </p>
          )}
        </div>
      </div>
    </div>
  )
}