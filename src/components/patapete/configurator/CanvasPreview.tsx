import { useEffect, useState } from 'react'
import { Style, Pet } from './types'
import { compositeRug, PetCompositeData } from '@/utils/canvasCompositing'
import { removeBackgroundFloodFill } from '@/utils/imagePreprocessing'

// Demo images per style — stored in repo /public/demos/ with transparent background
const DEMO_URLS: Record<Style, string[]> = {
  dibujo: [
    '/demos/icono-0.webp',
    '/demos/icono-1.webp',
    '/demos/icono-2.webp',
  ],
  icono: [
    '/demos/icono-0.webp',
    '/demos/icono-1.webp',
    '/demos/icono-2.webp',
  ],
}

// Coir rug mockup (2048×2048) — stored in repo public/ folder
const TAPETE_URL = '/tapete-mockup.webp'

// ── Layout config — all values are % of the square container ─────────────────
type PetCount = 1 | 2 | 3

const LAYOUTS: Record<PetCount, { pets: { left: string }[]; petWidth: string; petTop: string }> = {
  1: {
    pets: [{ left: '36.32%' }],
    petWidth: '27.39%',
    petTop: '45.26%',
  },
  2: {
    pets: [{ left: '18.06%' }, { left: '52.29%' }],
    petWidth: '27.39%',
    petTop: '45.26%',
  },
  3: {
    pets: [{ left: '15.28%' }, { left: '39.30%' }, { left: '63.81%' }],
    petWidth: '20.55%',
    petTop: '49.21%',
  },
}

// cqw font sizes — scaled up for better readability on the rug
const FONT = {
  phrase: '5.5cqw',   // top phrase — above pets
  name: '4.5cqw',     // pet name — floats just above each illustration
  phrase2: '3.8cqw',  // bottom phrase — below pets
}

// Default texts shown in preview when user hasn't typed anything
const DEFAULT_PHRASE  = 'Aquí manda'
const DEFAULT_PHRASE2 = 'No toques... ya sabemos que estás aquí'
const DEFAULT_NAMES   = ['Max', 'Luna', 'Coco']

// Pure black ink
const INK = '#000000'

interface CanvasPreviewProps {
  style: Style
  pets: Pet[]
  phrase: string
  phrase2?: string
  onPreviewReady?: (dataUrl: string) => void
}

export function CanvasPreview({ style, pets, phrase, phrase2, onPreviewReady }: CanvasPreviewProps) {
  const count = Math.min(Math.max(pets.length, 1), 3) as PetCount
  const layout = LAYOUTS[count]

  const petKey = pets.map(p => `${p.generatedArtUrl || ''}:${p.name}`).join('|')

  // Processed image URLs: flood-fill removes outer white background while preserving
  // interior white areas (chest, eyes). Demo images are already transparent — passthrough.
  const [processedUrls, setProcessedUrls] = useState<Record<number, string>>({})

  useEffect(() => {
    const newUrls: Record<number, string> = {}
    const promises = pets.map(async (pet, i) => {
      const raw = pet.generatedArtUrl || DEMO_URLS[style][i]
      if (pet.generatedArtUrl) {
        // Generated JPEG from FLUX → remove outer white background
        newUrls[i] = await removeBackgroundFloodFill(raw).catch(() => raw)
      } else {
        // Demo images are already transparent webp — use directly
        newUrls[i] = raw
      }
    })
    Promise.all(promises).then(() => setProcessedUrls(newUrls)).catch(console.error)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petKey, style])

  // Background canvas → generates the cart preview thumbnail (must match the HTML/CSS layout)
  useEffect(() => {
    if (!onPreviewReady) return
    const petData: PetCompositeData[] = pets.map((pet, i) => ({
      imageUrl: pet.generatedArtUrl || DEMO_URLS[style][i],
      name: pet.name,
      isGenerated: !!pet.generatedArtUrl,
      isDemo: !pet.generatedArtUrl,
    }))
    compositeRug(petData, phrase, phrase2).then(onPreviewReady).catch(console.error)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petKey, phrase, phrase2])

  return (
    // .tapete-preview sets container-type: inline-size (see index.css)
    // so cqw units scale with the container width, not the viewport.
    <div className="tapete-preview relative w-full aspect-square rounded-2xl overflow-hidden border border-border shadow-inner">

      {/* ── Scaled content wrapper — zooms in 12% so rug fills more of the frame ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: 'scale(1.12)',
          transformOrigin: 'center center',
        }}
      >
        {/* ── Rug background ─────────────────────────────────────────────── */}
        <img
          src={TAPETE_URL}
          alt="Tapete personalizado Patapete"
          className="absolute inset-0 w-full h-full object-cover select-none"
          crossOrigin="anonymous"
          draggable={false}
        />

        {/* ── Phrase — top area of rug surface (34.71%) ──────────────────── */}
        <p
          className="absolute w-full text-center pointer-events-none"
          style={{
            top: '34.71%',
            fontSize: FONT.phrase,
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: 800,
            color: INK,
            padding: '0 8%',
            lineHeight: 1.1,
          }}
        >
          {phrase?.trim() || DEFAULT_PHRASE}
        </p>

        {/* ── Pet illustrations ───────────────────────────────────────────── */}
        {layout.pets.map((petLayout, i) => {
          const pet = pets[i]
          if (!pet) return null
          // Use flood-fill processed URL (outer bg removed, white chest preserved)
          // Falls back to raw URL while processing runs, then to demo image
          const imgUrl = processedUrls[i] || pet.generatedArtUrl || DEMO_URLS[style][i]

          return (
            <div
              key={i}
              className="absolute"
              style={{
                width: layout.petWidth,
                top: layout.petTop,
                left: petLayout.left,
              }}
            >
              {/* Name floats above the pet illustration */}
              <span
                className="absolute w-full text-center pointer-events-none"
                style={{
                  top: 0,
                  transform: 'translateY(calc(-100% - 1.5cqw))',  /* cqw scales with container — no overlap on any screen size */
                  paddingBottom: '0px',
                  fontSize: FONT.name,
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  fontWeight: 800,
                  color: INK,
                  whiteSpace: 'nowrap',
                }}
              >
                {pet.name?.trim() || DEFAULT_NAMES[i]}
              </span>

              {/* Pet illustration — rendered directly, no background removal needed */}
              <img
                src={imgUrl}
                alt={pet.name || `Mascota ${i + 1}`}
                className="w-full h-auto block select-none"
                draggable={false}
              />
            </div>
          )
        })}

        {/* ── Phrase 2 — bottom area of rug (below pets) ─────────────────── */}
        <p
          className="absolute w-full text-center pointer-events-none"
          style={{
            top: '70%',
            fontSize: FONT.phrase2,
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: 800,
            color: INK,
            padding: '0 8%',
            lineHeight: 1.2,
          }}
        >
          {phrase2?.trim() || DEFAULT_PHRASE2}
        </p>
      </div>
    </div>
  )
}