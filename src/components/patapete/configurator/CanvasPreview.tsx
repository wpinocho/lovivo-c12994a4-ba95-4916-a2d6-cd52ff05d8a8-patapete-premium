import { useEffect, useState } from 'react'
import { Style, Pet } from './types'
import { compositeRug, PetCompositeData } from '@/utils/canvasCompositing'
import { Loader2 } from 'lucide-react'

// Demo images: pre-generated pet illustrations shown before user uploads their photo.
const DEMO_IMAGES = [
  '/demo/pet-demo-1.webp',
  '/demo/pet-demo-2.webp',
  '/demo/pet-demo-3.webp',
]

interface CanvasPreviewProps {
  style: Style
  pets: Pet[]
  phrase: string
  onPreviewReady?: (dataUrl: string) => void
}

export function CanvasPreview({ style, pets, phrase, onPreviewReady }: CanvasPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasRealImage, setHasRealImage] = useState(false)

  // Stable key: only re-run when AI art URL or name changes.
  // Intentionally excludes photoPreviewUrl — the canvas should NOT update on raw photo upload,
  // only when the AI-generated art arrives.
  const petKey = pets.map(p => `${p.generatedArtUrl || ''}:${p.name}`).join('|')

  useEffect(() => {
    let cancelled = false

    const buildPreview = async () => {
      setIsLoading(true)

      try {
        // Build petData: ONLY use AI-generated art as the real image.
        // Raw photoPreviewUrl is intentionally NOT used here — the canvas must only
        // show the AI result or the demo placeholder, never the raw uploaded photo.
        const petData: PetCompositeData[] = pets.map((pet, i) => {
          const artUrl = pet.generatedArtUrl  // null until AI pipeline completes
          return {
            imageUrl: artUrl || DEMO_IMAGES[i % DEMO_IMAGES.length],
            name: pet.name,
            isDemo: !artUrl,
            isGenerated: !!artUrl,
          }
        })

        const anyReal = petData.some(p => !p.isDemo)

        const dataUrl = await compositeRug(petData, phrase)

        if (cancelled) return // newer render started, discard this result

        setHasRealImage(anyReal)
        setPreviewUrl(dataUrl)
        onPreviewReady?.(dataUrl)
      } catch (err) {
        console.error('Canvas preview error:', err)
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    buildPreview()

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style, petKey, phrase])

  return (
    <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-muted border border-border shadow-inner">
      {previewUrl ? (
        <img
          src={previewUrl}
          alt="Preview de tu tapete personalizado"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
        </div>
      )}

      {/* Demo badge: subtle indicator that it's an example preview */}
      {previewUrl && !hasRealImage && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-background/75 backdrop-blur-sm border border-border/50 rounded-full px-3 py-1">
          <p className="text-xs text-muted-foreground font-medium">Ejemplo · Sube tu foto para ver tu mascota</p>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
          <div className="text-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-xs text-muted-foreground">Generando preview...</p>
          </div>
        </div>
      )}
    </div>
  )
}