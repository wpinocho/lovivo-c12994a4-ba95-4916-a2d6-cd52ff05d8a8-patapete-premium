import { useRef } from 'react'
import { Pet } from './types'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X, Loader2, RefreshCw, Sparkles } from 'lucide-react'

interface PhotoPetFormProps {
  petIndex: number
  pet: Pet
  onChange: (updates: Partial<Pet>) => void
  onGenerate: (file: File) => void
}

export function PhotoPetForm({ petIndex, pet, onChange, onGenerate }: PhotoPetFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    onChange({ photoFile: file, photoPreviewUrl: url, processedImageUrl: null, generatedArtUrl: null })
    // Auto-generate immediately after upload
    onGenerate(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    onChange({ photoFile: file, photoPreviewUrl: url, processedImageUrl: null, generatedArtUrl: null })
    // Auto-generate immediately after upload
    onGenerate(file)
  }

  const isProcessing = pet.isProcessingBg || pet.isGeneratingArt
  const hasResult = !!pet.generatedArtUrl
  // Has photo but no result and not currently processing = generation failed or reset
  const canRetry = !!pet.photoFile && !hasResult && !isProcessing

  const statusMessage = pet.isProcessingBg
    ? 'Preparando imagen...'
    : pet.isGeneratingArt
      ? 'Creando tu retrato con IA... (~45s)'
      : ''

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
          {petIndex + 1}
        </div>
        <span className="font-semibold text-sm text-foreground">
          Mascota {petIndex + 1}
        </span>
        {hasResult && (
          <span className="ml-auto text-xs font-medium text-green-600 flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
            <Sparkles className="w-3 h-3" /> Retrato listo
          </span>
        )}
      </div>

      {/* Upload zone or preview */}
      {!pet.photoPreviewUrl ? (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all group"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm text-foreground">Sube la foto de tu mascota</p>
            <p className="text-xs text-muted-foreground mt-1">Arrastra aquí o haz clic · JPG, PNG, WEBP</p>
          </div>
          <p className="text-xs text-muted-foreground text-center bg-muted/60 px-3 py-1.5 rounded-xl">
            💡 Foto bien iluminada, carita visible, fondo simple
          </p>
        </div>
      ) : (
        <div className="relative">
          <div className={cn(
            "aspect-square rounded-2xl overflow-hidden bg-muted border-2 transition-all",
            hasResult ? "border-green-300 shadow-md shadow-green-100" : "border-border"
          )}>
            <img
              src={hasResult ? pet.generatedArtUrl! : pet.photoPreviewUrl}
              alt={hasResult ? `Retrato IA de mascota ${petIndex + 1}` : `Foto de mascota ${petIndex + 1}`}
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
              title="Cambiar foto"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Loading overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-background/75 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-3">
              <div className="relative">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              </div>
              <div className="text-center px-4">
                <p className="text-sm font-semibold text-foreground">{statusMessage}</p>
                <p className="text-xs text-muted-foreground mt-1">BiRefNet + FLUX Dev trabajando en tu retrato</p>
              </div>
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

      {/* Retry button when generation failed */}
      {canRetry && (
        <button
          onClick={() => pet.photoFile && onGenerate(pet.photoFile)}
          className="w-full flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors py-2 border border-primary/30 rounded-xl hover:bg-primary/5"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar generación con IA
        </button>
      )}

      {/* Pet name */}
      <div className="space-y-1.5">
        <Label htmlFor={`pet-name-${petIndex}`} className="text-sm font-medium text-foreground">
          Nombre de tu mascota <span className="font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <Input
          id={`pet-name-${petIndex}`}
          placeholder="Ej: Max, Luna, Mochi..."
          value={pet.name}
          onChange={e => onChange({ name: e.target.value })}
          maxLength={20}
          className="rounded-xl"
        />
      </div>
    </div>
  )
}