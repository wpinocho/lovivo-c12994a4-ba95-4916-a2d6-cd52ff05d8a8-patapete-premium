import { Pet, PRICES, Style } from './types'
import { PhotoPetForm } from './PhotoPetForm'
import { CanvasPreview } from './CanvasPreview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { PenLine, Palette, Star } from 'lucide-react'

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
  onPreviewReady: (dataUrl: string) => void
}

export function StepPets({
  style, petCount, pets, phrase, phrase2,
  onStyleChange, onPetCountChange, onPetChange, onPhraseChange, onPhrase2Change,
  onGenerate, onContinue, onPreviewReady,
}: StepPetsProps) {
  const isProcessing = pets.some(p => p.isProcessingBg || p.isGeneratingArt)
  const allPhotosUploaded = pets.slice(0, petCount).every(
    p => !!p.photoFile || !!p.photoBase64 || !!p.generatedArtUrl
  )
  const canContinue = !isProcessing && allPhotosUploaded

  const price = PRICES[style][petCount]

  return (
    <div className="space-y-6">
      {/* Product page header — título, rating, precio */}
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
        </div>
        <div className="sm:text-right shrink-0">
          <div className="text-3xl font-bold text-foreground">
            ${price.toLocaleString('es-MX')}
            <span className="text-base font-normal text-muted-foreground ml-1">MXN</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Hecho a pedido en México</p>
        </div>
      </div>

      {/* Desktop: 2-column layout */}
      <div className="flex flex-col-reverse lg:grid lg:grid-cols-2 lg:gap-8 gap-6">

        {/* LEFT: Canvas preview */}
        <div className="space-y-3">
          <div className="hidden lg:block">
            <CanvasPreview
              style={style}
              pets={pets.slice(0, petCount)}
              phrase={phrase}
              phrase2={phrase2}
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

          {/* Style selector — first decision */}
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

          {/* Mobile: Canvas preview */}
          <div className="lg:hidden">
            <CanvasPreview
              style={style}
              pets={pets.slice(0, petCount)}
              phrase={phrase}
              phrase2={phrase2}
              onPreviewReady={onPreviewReady}
            />
          </div>

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

          {/* Continue button */}
          <Button
            onClick={onContinue}
            disabled={!canContinue}
            className="w-full rounded-xl"
            size="lg"
          >
            {isProcessing
              ? 'Generando tu retrato...'
              : canContinue
                ? `Ver resumen — $${price.toLocaleString('es-MX')} MXN →`
                : 'Ver resumen →'
            }
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