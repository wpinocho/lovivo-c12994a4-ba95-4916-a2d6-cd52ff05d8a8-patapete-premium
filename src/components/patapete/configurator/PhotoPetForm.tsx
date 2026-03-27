import { useRef, useState, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { Pet } from './types'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, RefreshCw, Camera } from 'lucide-react'
import { trackCustomEvent } from '@/lib/tracking-utils'

interface PhotoPetFormProps {
  petIndex: number
  pet: Pet
  onChange: (updates: Partial<Pet>) => void
  onGenerate: (file?: File) => void
  onClear: () => void
  photoError?: string
  nameError?: string
  /** Called once on mount with the function that opens the file picker */
  onRegisterTrigger?: (fn: () => void) => void
}

// Ease-out curve: fast at start, slow at end (~20s total)
const PROGRESS_MILESTONES = [
  { at: 0,     pct: 8  },
  { at: 2000,  pct: 28 },
  { at: 5000,  pct: 48 },
  { at: 9000,  pct: 64 },
  { at: 13000, pct: 76 },
  { at: 17000, pct: 86 },
  { at: 21000, pct: 93 },
]

export function PhotoPetForm({ petIndex, pet, onChange, onGenerate, onClear, photoError, nameError, onRegisterTrigger }: PhotoPetFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState(0)

  const isProcessing = pet.isProcessingBg || pet.isGeneratingArt
  const hasResult = !!pet.generatedArtUrl
  const canRetry = (!!pet.photoFile || !!pet.photoBase64) && !hasResult && !isProcessing

  // ── Expose file input trigger to parent ──────────────────────────────────
  useEffect(() => {
    onRegisterTrigger?.(() => fileInputRef.current?.click())
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Track when upload zone is visible (only for pet 0) ───────────────────
  const { ref: uploadZoneRef, inView: uploadZoneInView } = useInView({
    threshold: 0.5,
    triggerOnce: true,
  })
  useEffect(() => {
    if (uploadZoneInView && petIndex === 0) {
      trackCustomEvent('upload_zone_viewed', { pet_index: petIndex })
    }
  }, [uploadZoneInView, petIndex])

  // ── Progress bar animation ────────────────────────────────────────────────
  useEffect(() => {
    if (!isProcessing) return
    setProgress(PROGRESS_MILESTONES[0].pct)
    const timers = PROGRESS_MILESTONES.slice(1).map(({ at, pct }) =>
      setTimeout(() => setProgress(pct), at)
    )
    return () => timers.forEach(clearTimeout)
  }, [isProcessing])

  useEffect(() => {
    if (!isProcessing && hasResult) setProgress(100)
  }, [isProcessing, hasResult])

  useEffect(() => {
    if (!pet.photoPreviewUrl) setProgress(0)
  }, [pet.photoPreviewUrl])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    onChange({ photoFile: file, photoPreviewUrl: url, processedImageUrl: null, generatedArtUrl: null, progressMessage: '' })
    trackCustomEvent('photo_uploaded', {
      pet_index: petIndex,
      file_type: file.type,
      source: 'file_input',
    })
    onGenerate(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    onChange({ photoFile: file, photoPreviewUrl: url, processedImageUrl: null, generatedArtUrl: null, progressMessage: '' })
    trackCustomEvent('photo_uploaded', {
      pet_index: petIndex,
      file_type: file.type,
      source: 'drag_and_drop',
    })
    onGenerate(file)
  }

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
          {petIndex + 1}
        </div>
        <span className="font-semibold text-sm text-foreground">Mascota {petIndex + 1}</span>
      </div>

      {/* ── Layout: full-width upload when no photo, compact when photo uploaded ── */}
      {!pet.photoPreviewUrl ? (

        /* Full-width upload zone */
        <div
          ref={uploadZoneRef}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'w-full min-h-[120px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all group animate-in fade-in-0 zoom-in-95 duration-300',
            photoError
              ? 'border-destructive bg-destructive/5'
              : 'border-primary/40 bg-primary/5 hover:border-primary/70 hover:bg-primary/10'
          )}
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
            <Camera className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center px-4">
            <p className="text-sm font-semibold text-foreground">Sube la foto de tu mascota</p>
            <p className="text-xs text-muted-foreground mt-0.5">Toca aquí · JPG, PNG, WEBP</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Mejor si se ve bien la carita 🐾</p>
          </div>
          {photoError && (
            <p className="text-xs text-destructive text-center px-4">
              ⚠️ {photoError}
            </p>
          )}
        </div>

      ) : (

        /* Compact horizontal layout with photo */
        <div className="flex gap-3 items-start">

          {/* Thumbnail */}
          <div className="relative shrink-0 w-[88px] h-[88px]">
            {isProcessing && (
              <div className="absolute -inset-[3px] rounded-[14px] bg-gradient-to-br from-primary/50 to-primary/20 animate-pulse" />
            )}
            <div className={cn(
              'relative w-full h-full rounded-xl overflow-hidden border-2 transition-all duration-500',
              isProcessing
                ? 'border-primary/70'
                : hasResult
                  ? 'border-accent shadow-sm shadow-accent/10'
                  : 'border-border'
            )}>
              <img
                src={pet.photoPreviewUrl}
                alt={`Foto mascota ${petIndex + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            {!isProcessing && (
              <button
                onClick={() => {
                  onClear()
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-background border border-border rounded-full flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors shadow-sm"
                title="Cambiar foto"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          {/* Right side */}
          <div className="flex-1 min-w-0">
            {isProcessing ? (
              <div className="space-y-2 pt-0.5">
                <p className="text-sm font-semibold text-foreground leading-tight">
                  Creando tu retrato...
                </p>
                <p className="text-xs text-muted-foreground leading-snug min-h-[16px] transition-all duration-700">
                  {pet.progressMessage || 'Analizando tu mascota...'}
                </p>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-[width] duration-1000 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground/60 leading-tight">
                  Cada retrato es único para tu mascota
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <Label htmlFor={`pet-name-${petIndex}`} className="text-xs font-medium text-foreground">
                  Nombre de tu mascota
                </Label>
                <Input
                  id={`pet-name-${petIndex}`}
                  placeholder={(['Max', 'Luna', 'Coco'])[petIndex] || 'Max'}
                  value={pet.name}
                  onChange={e => onChange({ name: e.target.value })}
                  maxLength={20}
                  className={cn('h-8 text-sm rounded-lg', nameError && 'border-destructive focus-visible:ring-destructive')}
                />
                {nameError && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <span>⚠️</span> {nameError}
                  </p>
                )}
              </div>
            )}

            {/* Retry button */}
            {canRetry && (
              <button
                onClick={() => onGenerate(pet.photoFile ?? undefined)}
                className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors py-1 px-2 border border-primary/30 rounded-lg hover:bg-primary/5 w-full justify-center"
              >
                <RefreshCw className="w-3 h-3" />
                Reintentar con IA
              </button>
            )}
          </div>
        </div>
      )}

      {/* Name input shown BELOW when loading (accessible while waiting) */}
      {pet.photoPreviewUrl && isProcessing && (
        <div className="space-y-1">
          <Label htmlFor={`pet-name-loading-${petIndex}`} className="text-xs font-medium text-foreground">
            Nombre de tu mascota
          </Label>
          <Input
            id={`pet-name-loading-${petIndex}`}
            placeholder={(['Max', 'Luna', 'Coco'])[petIndex] || 'Max'}
            value={pet.name}
            onChange={e => onChange({ name: e.target.value })}
            maxLength={20}
            className={cn('h-8 text-sm rounded-lg', nameError && 'border-destructive focus-visible:ring-destructive')}
          />
          {nameError && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <span>⚠️</span> {nameError}
            </p>
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
    </div>
  )
}