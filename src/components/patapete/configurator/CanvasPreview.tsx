import { useEffect, useRef, useState } from 'react'
import { Style, Pet } from './types'
import { compositeRug, PetCompositeData } from '@/utils/canvasCompositing'
import { getBreedById } from '@/data/breedData'
import { Loader2 } from 'lucide-react'

interface CanvasPreviewProps {
  style: Style
  pets: Pet[]
  phrase: string
  onPreviewReady?: (dataUrl: string) => void
}

export function CanvasPreview({ style, pets, phrase, onPreviewReady }: CanvasPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const renderKeyRef = useRef(0)

  useEffect(() => {
    const currentKey = ++renderKeyRef.current
    const myKey = currentKey

    const buildPreview = async () => {
      setIsLoading(true)

      try {
        const petData: PetCompositeData[] = pets.map(pet => {
          if (style === 'icon') {
            const breed = getBreedById(pet.breedId)
            return {
              imageUrl: breed?.imageUrl || '',
              name: pet.name,
            }
          } else {
            // IA/Vector: use generatedArtUrl if available, else photoPreviewUrl
            return {
              imageUrl: pet.generatedArtUrl || pet.photoPreviewUrl || '',
              name: pet.name,
            }
          }
        })

        // Only composite if we have at least one image
        const hasSomething = petData.some(p => p.imageUrl)
        if (!hasSomething) {
          setIsLoading(false)
          return
        }

        const dataUrl = await compositeRug(petData, phrase)

        if (myKey !== renderKeyRef.current) return // stale

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
          <div className="text-center space-y-2">
            <p className="text-4xl">🐾</p>
            <p className="text-sm text-muted-foreground">Tu tapete aparecerá aquí</p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  )
}