import { useEffect, useRef, useState } from 'react'
import { Style, Pet } from './types'
import { compositeRug, PetCompositeData } from '@/utils/canvasCompositing'
import { Loader2 } from 'lucide-react'

// Demo images: pre-generated pet illustrations shown before user uploads their photo.
// Same technique used by TeeInBlue and PawPeludo — tapete always looks complete from load.
const DEMO_IMAGES = [
  '/demo/pet-demo-1.png',
  '/demo/pet-demo-2.png',
  '/demo/pet-demo-3.png',
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
  const renderKeyRef = useRef(0)

  useEffect(() => {
    const currentKey = ++renderKeyRef.current
    const myKey = currentKey

    const buildPreview = async () => {
      setIsLoading(true)

      try {
        // Build petData: use real image (generated or photo preview) if available,
        // otherwise fall back to a demo image so the tapete always looks populated.
        const petData: PetCompositeData[] = pets.map((pet, i) => {
          const realUrl = pet.generatedArtUrl || pet.photoPreviewUrl
          return {
            imageUrl: realUrl || DEMO_IMAGES[i % DEMO_IMAGES.length],
            name: pet.name,
            isDemo: !realUrl,
          }
        })

        const anyReal = petData.some(p => !p.isDemo)
        setHasRealImage(anyReal)

        const dataUrl = await compositeRug(petData, phrase)

        if (myKey !== renderKeyRef.current) return // stale render, discard

        setPreviewUrl(dataUrl)
        onPreviewReady?.(dataUrl)
      } catch (err) {
        console.error('Canvas preview error:', err)
      } finally {
        if (myKey === renderKeyRef.current) {
          setIsLoading(false)
        }
      }
    }

    buildPreview()
  }, [style, pets, phrase])

  return (
    <div className="relative w-full aspect-[3/2] rounded-2xl overflow-hidden bg-muted border border-border shadow-inner">
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