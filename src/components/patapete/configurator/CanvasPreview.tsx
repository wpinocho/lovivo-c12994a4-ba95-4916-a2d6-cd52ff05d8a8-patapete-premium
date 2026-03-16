import { useEffect, useState, useRef } from 'react'
import { Style, Pet } from './types'
import { compositeRug, PetCompositeData } from '@/utils/canvasCompositing'
import { removeWhiteBackground } from '@/utils/imagePreprocessing'

// Demo images per style and pet index (0-based)
// ✅ All stored in repo /public/demos/ — same origin, no CORS issues, never expire
// ⚠️ dibujo: pending user images — using icono as placeholder until replaced
const DEMO_URLS: Record<Style, string[]> = {
  dibujo: [
    '/demos/icono-0.webp',  // ⏳ TEMP: replace with real dibujo images when provided
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

  // Cache of processed transparent URLs keyed by original URL
  const [transparentUrls, setTransparentUrls] = useState<Record<string, string>>({})
  const processingRef = useRef<Set<string>>(new Set())

  // Collect all image URLs needed this render
  const imgUrls = pets.map((pet, i) => pet.generatedArtUrl || DEMO_URLS[style][i])

  useEffect(() => {
    pets.forEach((pet, i) => {
      const isGenerated = !!pet.generatedArtUrl
      const url = pet.generatedArtUrl || DEMO_URLS[style][i]

      if (transparentUrls[url] || processingRef.current.has(url)) return
      processingRef.current.add(url)

      if (isGenerated) {
        // PNG already transparent from server (BiRefNet ran server-side) — use as-is, no white removal
        setTransparentUrls((prev) => ({ ...prev, [url]: url }))
      } else {
        // Demo images have white bg — remove client-side
        removeWhiteBackground(url).then((transparentUrl) => {
          setTransparentUrls((prev) => ({ ...prev, [url]: transparentUrl }))
        })
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgUrls.join('|')])

  // Background canvas → still needed for StepSummary's finalPreviewDataUrl
  const petKey = pets.map(p => `${p.generatedArtUrl || ''}:${p.name}`).join('|')

  useEffect(() => {
    if (!onPreviewReady) return
    const petData: PetCompositeData[] = pets.map((pet, i) => ({
      imageUrl: pet.generatedArtUrl || DEMO_URLS[style][i],
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
          const imgUrl = pet.generatedArtUrl || DEMO_URLS[style][i]

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
                  transform: 'translateY(calc(-100% + 14px))',
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

              {/* Pet illustration — only render once background removal is done (no white flash) */}
              {transparentUrls[imgUrl] && (
                <img
                  src={transparentUrls[imgUrl]}
                  alt={pet.name || `Mascota ${i + 1}`}
                  className="w-full h-auto block select-none"
                  draggable={false}
                />
              )}
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