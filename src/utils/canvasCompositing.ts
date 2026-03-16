import { removeWhiteBackground } from './imagePreprocessing'

/** Cross-browser rounded rect helper */
function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
  ctx.fill()
}

export interface PetCompositeData {
  imageUrl: string
  name?: string
  /** No photo uploaded yet — renders a placeholder demo illustration */
  isDemo?: boolean
  /** AI-generated art (white background) — background removed, composited cleanly */
  isGenerated?: boolean
}

// New lighter coir mat for clean multiply blend
const TAPETE_MOCKUP_URL = 'https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773256082834-gf5g5a3no07.webp'

// ─── Canvas layout constants (600×600 canvas) ─────────────────────────────────
//
// The rug mockup is 2048×2048 → scaled 1:1 to fill 600×600 (no cropping).
// Based on visual inspection, the rug's top edge sits at ~y=390 in canvas coords,
// and its bottom edge at ~y=545.
//
// Peekaboo layout:
//   • Pets peek ABOVE the rug — their paw line anchors at Y_PAW (top of rug interior)
//   • Pets are clipped at Y_CLIP (just below the paw line, showing paws but nothing below)
//   • Phrase rendered ARRIBA inside the rug (just below the paw/clip boundary)
//   • Names rendered below the phrase, still within the rug

const Y_PAW         = 415   // y where the peekaboo paw-line lands on canvas
const Y_CLIP        = 438   // clip pet art at this y (shows ~23 px of paws below the line)
const Y_PHRASE_BTM  = 474   // bottom of phrase text pill (inside rug, "arriba")
const PAW_RATIO     = 0.76  // paw line sits at ~76 % from the top of FLUX peekaboo output

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => {
      // Retry without crossOrigin for blob: / local files
      const img2 = new window.Image()
      img2.onload = () => resolve(img2)
      img2.onerror = reject
      img2.src = url
    }
    img.src = url
  })
}

// ─── Slot layout ──────────────────────────────────────────────────────────────
interface PetSlot { x: number; y: number; w: number; h: number }

/**
 * Returns pet slot positions anchored so that the paw line (PAW_RATIO * h from top)
 * lands exactly at Y_PAW. Pets will peek above the rug into the brick/door area.
 */
function getPetSlots(count: number, W: number, _H: number): PetSlot[] {
  const slotY = (s: number) => Math.round(Y_PAW - s * PAW_RATIO)

  switch (count) {
    case 1: {
      const s = 220
      return [{ x: Math.round((W - s) / 2), y: slotY(s), w: s, h: s }]
    }
    case 2: {
      const s   = 172
      const gap = 22
      const startX = Math.round((W - (s * 2 + gap)) / 2)
      const y = slotY(s)
      return [
        { x: startX,           y, w: s, h: s },
        { x: startX + s + gap, y, w: s, h: s },
      ]
    }
    case 3:
    default: {
      const s   = 142
      const gap = 14
      const startX = Math.round((W - (s * 3 + gap * 2)) / 2)
      const y = slotY(s)
      return [
        { x: startX,               y, w: s, h: s },
        { x: startX + s + gap,     y, w: s, h: s },
        { x: startX + (s + gap)*2, y, w: s, h: s },
      ]
    }
  }
}

// ─── Main composite function ──────────────────────────────────────────────────
/**
 * Renders a tapete preview with pet images composited onto the rug mockup.
 *
 * Layout (top→bottom in the 600×600 canvas):
 *   1. Rug mockup background (full canvas)
 *   2. Pet portraits — peekaboo style, heads above the rug, clipped at Y_CLIP
 *   3. Phrase text — inside the rug, just below the paw line ("arriba")
 *   4. Pet name labels — inside the rug, below the phrase
 *
 * Three rendering modes per pet:
 *   isDemo=true       → circular clip, 0.45 opacity (placeholder, no peekaboo clip)
 *   isGenerated=true  → clip to Y_CLIP + multiply blend (white bg disappears onto rug)
 *   otherwise         → clip to Y_CLIP + 0.72 opacity (raw photo in transit)
 */
export async function compositeRug(
  pets: PetCompositeData[],
  phrase?: string,
  mockupUrl: string = TAPETE_MOCKUP_URL
): Promise<string> {
  const W = 600
  const H = 600

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // ── 1. Draw rug mockup ─────────────────────────────────────────────────────
  try {
    const tapete = await loadImage(mockupUrl)
    const scale  = Math.max(W / tapete.naturalWidth, H / tapete.naturalHeight)
    const tw     = tapete.naturalWidth  * scale
    const th     = tapete.naturalHeight * scale
    ctx.drawImage(tapete, (W - tw) / 2, (H - th) / 2, tw, th)
  } catch {
    const grad = ctx.createLinearGradient(0, 0, W, H)
    grad.addColorStop(0, '#c8a46e')
    grad.addColorStop(1, '#a07840')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)
  }

  const slots = getPetSlots(pets.length, W, H)

  // ── 2. First pass: pet images (no names yet) ───────────────────────────────
  for (let i = 0; i < pets.length; i++) {
    const pet  = pets[i]
    const slot = slots[i]
    if (!pet?.imageUrl) continue

    try {
      // Remove white background so the art composites cleanly (simulates sublimation)
      const drawUrl = (pet.isGenerated || pet.isDemo)
        ? await removeWhiteBackground(pet.imageUrl)
        : pet.imageUrl

      const img = await loadImage(drawUrl)
      const { x, y, w, h } = slot

      ctx.save()

      // ── Peekaboo: clip to Y_CLIP (head above rug, paws visible, nothing below) ──
      const clipH = Math.min(h, Math.max(10, Y_CLIP - y))
      ctx.beginPath()
      ctx.rect(x, y, w, clipH)
      ctx.clip()

      if (pet.isGenerated || pet.isDemo) {
        // Transparent PNG → composite cleanly over rug (no blend mode needed)
        ctx.drawImage(img, x, y, w, h)
      } else {
        // Raw upload in transit: show semi-transparent while AI processes
        ctx.globalAlpha = 0.72
        ctx.drawImage(img, x, y, w, h)
      }

      ctx.restore()
    } catch {
      // Skip pet if image fails to load
    }
  }

  // ── 3. Phrase — inside rug, ARRIBA (just below the paw line) ──────────────
  if (phrase?.trim()) {
    const text     = `"${phrase.trim()}"`
    const fontSize = Math.max(13, Math.min(20, W / text.length * 1.0))
    ctx.save()
    ctx.font          = `800 ${fontSize}px 'Plus Jakarta Sans', sans-serif`
    ctx.textAlign     = 'center'
    ctx.textBaseline  = 'bottom'
    const textW = ctx.measureText(text).width

    // Pill background
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    fillRoundRect(
      ctx,
      W / 2 - textW / 2 - 14,
      Y_PHRASE_BTM - fontSize - 4,
      textW + 28,
      fontSize + 10,
      6
    )

    ctx.fillStyle = '#f5e1c3'
    ctx.fillText(text, W / 2, Y_PHRASE_BTM)
    ctx.restore()
  }

  // ── 4. Second pass: pet name labels (below phrase, inside rug) ─────────────
  // Position names below the phrase if present, or just below the paw clip if not.
  const yNames = phrase?.trim() ? Y_PHRASE_BTM + 26 : Y_PAW + 52

  for (let i = 0; i < pets.length; i++) {
    const pet  = pets[i]
    const slot = slots[i]
    if (!pet?.name?.trim()) continue

    const fontSize = Math.max(11, Math.round(Math.min(slot.w, slot.h) * 0.10))
    ctx.save()
    ctx.font          = `bold ${fontSize}px 'Plus Jakarta Sans', sans-serif`
    ctx.textAlign     = 'center'
    ctx.textBaseline  = 'top'
    const labelX = slot.x + slot.w / 2
    const textW  = ctx.measureText(pet.name).width
    const pillH  = fontSize * 1.4
    const pillPad = 8

    ctx.fillStyle = 'rgba(0,0,0,0.40)'
    fillRoundRect(ctx, labelX - textW / 2 - pillPad, yNames, textW + pillPad * 2, pillH, 4)

    ctx.fillStyle = '#f5e1c3'
    ctx.fillText(pet.name, labelX, yNames + 2)
    ctx.restore()
  }

  return canvas.toDataURL('image/jpeg', 0.92)
}