import { useRef } from 'react'
import { Pet, Style } from './types'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Upload, X, Loader2, Sparkles, Pen } from 'lucide-react'

interface PhotoPetFormProps {
  petIndex: number
  style: Style
  pet: Pet
  onChange: (updates: Partial<Pet>) => void
  onGenerate: () => void
}

export function PhotoPetForm({ petIndex, style, pet, onChange, onGenerate }: PhotoPetFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    onChange({
      photoFile: file,
      photoPreviewUrl: url,
      processedImageUrl: null,
      generatedArtUrl: null,
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    onChange({
      photoFile: file,
      photoPreviewUrl: url,
      processedImageUrl: null,
      generatedArtUrl: null,
    })
  }

  const isProcessing = pet.isProcessingBg || pet.isGeneratingArt
  const hasResult = !!pet.generatedArtUrl
  const canGenerate = !!pet.photoFile && !isProcessing && !hasResult

  const statusMessage = pet.isProcessingBg
    ? 'Quitando el fondo...'
    : pet.isGeneratingArt
      ? style === 'tattoo'
        ? 'Generando arte con IA... (~30s)'
        : 'Aplicando efecto vectorial...'
      : hasResult
        ? '¡Arte generado! ✓'
        : ''

  return (
    <div className="space-y-4">
      <div className="font-semibold text-sm text-foreground">
        Mascota {petIndex + 1}
      </div>

      {/* Upload zone or preview */}
      {!pet.photoPreviewUrl ? (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/60 hover:bg-primary/2 transition-all"
        >
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Upload className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-medium text-sm text-foreground">Sube la foto de tu mascota</p>
            <p className="text-xs text-muted-foreground mt-1">Arrastra aquí o haz clic · JPG, PNG, WEBP</p>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            💡 Tip: Foto bien iluminada, fondo simple, mascota centrada
          </p>
        </div>
      ) : (
        <div className="relative">
          <div className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border">
            <img
              src={hasResult ? pet.generatedArtUrl! : pet.photoPreviewUrl}
              alt="Foto de mascota"
              className="w-full h-full object-cover"
            />
          </div>
          {/* Change photo button */}
          {!isProcessing && (
            <button
              onClick={() => {
                onChange({ photoFile: null, photoPreviewUrl: null, processedImageUrl: null, generatedArtUrl: null })
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              className="absolute top-2 right-2 w-8 h-8 bg-background/80 backdrop-blur rounded-full border border-border flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {/* Loading overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground text-center px-4">{statusMessage}</p>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Generate button */}
      {pet.photoPreviewUrl && !hasResult && (
        <Button
          onClick={onGenerate}
          disabled={!canGenerate}
          className="w-full rounded-xl"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {statusMessage}
            </>
          ) : (
            <>
              {style === 'tattoo'
                ? <><Sparkles className="mr-2 h-4 w-4" />Generar con IA</>
                : <><Pen className="mr-2 h-4 w-4" />Vectorizar foto</>
              }
            </>
          )}
        </Button>
      )}

      {hasResult && (
        <div className="flex items-center gap-2 text-sm text-green-600 font-medium bg-green-50 rounded-xl px-4 py-2.5 border border-green-200">
          <span className="text-base">✓</span> Arte generado exitosamente
        </div>
      )}

      {/* Pet name */}
      <div className="space-y-1.5">
        <Label htmlFor={`pet-name-${petIndex}`} className="text-sm font-medium text-foreground">
          Nombre <span className="font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <Input
          id={`pet-name-${petIndex}`}
          placeholder="Ej: Max, Luna..."
          value={pet.name}
          onChange={e => onChange({ name: e.target.value })}
          maxLength={20}
          className="rounded-xl"
        />
      </div>
    </div>
  )
}