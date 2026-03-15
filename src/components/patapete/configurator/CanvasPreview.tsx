import { useEffect } from 'react'
import { Style, Pet } from './types'
import { compositeRug, PetCompositeData } from '@/utils/canvasCompositing'

// Border Terrier peekaboo demo — white background, multiply-blends onto rug texture
const DEMO_PET_URL =
  'https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773506866318-25g4wpclpbo.webp'

// Lighter coir rug mockup (2048×2048)
const TAPETE_URL =
  'https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773256082834-gf5g5a3no07.webp'

// ── Layout config — all values are % of the square container ─────────────────
// Coordinates converted from Figma (2048×2048 frame).
// petTop   = top of the pet wrapper (head of dog)
// petWidth = width of the pet wrapper (height is auto, image-driven)
// left     = horizontal offset for each pet slot
// ─────────────────────────────────────────────────────────────────────────────
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

// cqw font sizes — reduced so phrase + name don't overlap
// (Playfair Display has tall ascenders, use conservative values)
const FONT = {
  phrase: '3.5cqw',   // top phrase — above pets
  name: '3.0cqw',     // pet name — floats just above each illustration
  phrase2: '3.5cqw',  // bottom phrase — below pets
}

// Dark brown ink — readable on the coir rug texture
const INK = '#3d1f08'

interface CanvasPreviewProps {
  style: Style
  pets: Pet[]
  phrase: string
  phrase2?: string
  onPreviewReady?: (dataUrl: string) => void
}

export function CanvasPreview({ pets, phrase, phrase2, onPreviewReady }: CanvasPreviewProps) {
  const count = Math.min(Math.max(pets.length, 1), 3) as PetCount
  const layout = LAYOUTS[count]

  // Background canvas → still needed for StepSummary's finalPreviewDataUrl
  const petKey = pets.map(p => `${p.generatedArtUrl || ''}:${p.name}`).join('|')

  useEffect(() => {
    if (!onPreviewReady) return
    const petData: PetCompositeData[] = pets.map(pet => ({
      imageUrl: pet.generatedArtUrl || DEMO_PET_URL,
      name: pet.name,
      isGenerated: true,
    }))
    compositeRug(petData, phrase).then(onPreviewReady).catch(console.error)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petKey, phrase])

  return (
    // .tapete-preview sets container-type: inline-size (see index.css)
    // so cqw units scale with the container width, not the viewport.
    <div className="tapete-preview relative w-full aspect-square rounded-2xl overflow-hidden border border-border shadow-inner">

      {/* ── Rug background ─────────────────────────────────────────────── */}
      <img
        src={TAPETE_URL}
        alt="Tapete personalizado Patapete"
        className="absolute inset-0 w-full h-full object-cover select-none"
        crossOrigin="anonymous"
        draggable={false}
      />

      {/* ── Phrase — top area of rug surface (34.71%) ──────────────────── */}
      {phrase?.trim() && (
        <p
          className="absolute w-full text-center pointer-events-none"
          style={{
            top: '34.71%',
            fontSize: FONT.phrase,
            fontFamily: '"Playfair Display", Georgia, serif',
            fontStyle: 'italic',
            fontWeight: 700,
            color: INK,
            padding: '0 8%',
            lineHeight: 1.1,
          }}
        >
          {phrase}
        </p>
      )}

      {/* ── Pet illustrations ───────────────────────────────────────────── */}
      {layout.pets.map((petLayout, i) => {
        const pet = pets[i]
        if (!pet) return null
        const imgUrl = pet.generatedArtUrl || DEMO_PET_URL

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
            {pet.name?.trim() && (
              <span
                className="absolute w-full text-center font-bold pointer-events-none"
                style={{
                  // top:0 + translateY(-100%) = bottom of name aligns with top of wrapper
                  top: 0,
                  transform: 'translateY(calc(-100% - 4px))',
                  fontSize: FONT.name,
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  color: INK,
                  whiteSpace: 'nowrap',
                }}
              >
                {pet.name}
              </span>
            )}

            {/* Pet illustration — multiply blend removes white background onto rug */}
            <img
              src={imgUrl}
              alt={pet.name || `Mascota ${i + 1}`}
              className="w-full h-auto block select-none"
              style={{ mixBlendMode: 'multiply' }}
              crossOrigin="anonymous"
              draggable={false}
            />
          </div>
        )
      })}

      {/* ── Phrase 2 — bottom area of rug (below pets) ─────────────────── */}
      {phrase2?.trim() && (
        <p
          className="absolute w-full text-center pointer-events-none"
          style={{
            top: '74%',
            fontSize: FONT.phrase2,
            fontFamily: '"Playfair Display", Georgia, serif',
            fontStyle: 'italic',
            fontWeight: 700,
            color: INK,
            padding: '0 8%',
            lineHeight: 1.2,
          }}
        >
          {phrase2}
        </p>
      )}
    </div>
  )
}