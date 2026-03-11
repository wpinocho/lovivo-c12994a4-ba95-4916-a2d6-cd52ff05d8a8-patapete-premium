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
  /** AI-generated art (white background) — uses multiply blend to "tattoo" onto rug */
  isGenerated?: boolean
}

const TAPETE_MOCKUP_URL = '/tapete-mockup.jpg'

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

// ─── Rectangular slot layout ──────────────────────────────────────────────────
interface PetSlot { x: number; y: number; w: number; h: number }

function getPetSlots(count: number, W: number, H: number): PetSlot[] {
  const cy = Math.round(H * 0.44) // vertical center of all slots

  switch (count) {
    case 1: {
      const s = Math.round(H * 0.68)           // ~272 px at H=400 — más grande para retrato
      return [{ x: Math.round((W - s) / 2), y: Math.round(cy - s / 2), w: s, h: s }]
    }
    case 2: {
      const s    = Math.round(H * 0.54)         // ~216 px
      const gap  = Math.round(W * 0.04)         // ~24 px
      const startX = Math.round((W - (s * 2 + gap)) / 2)
      const y  = Math.round(cy - s / 2)
      return [
        { x: startX,         y, w: s, h: s },
        { x: startX + s + gap, y, w: s, h: s },
      ]
    }
    case 3:
    default: {
      const s    = Math.round(H * 0.42)         // ~168 px
      const gap  = Math.round(W * 0.022)        // ~13 px
      const startX = Math.round((W - (s * 3 + gap * 2)) / 2)
      const y  = Math.round(cy - s / 2)
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
 * Three rendering modes per pet:
 *   isDemo=true       → circular clip, 0.45 opacity (placeholder)
 *   isGenerated=true  → rectangular slot + multiply blend (white bg disappears, lines "tattoo" rug)
 *   otherwise         → rectangular slot, source-over, 0.75 opacity (raw photo in transit)
 */
export async function compositeRug(
  pets: PetCompositeData[],
  phrase?: string,
  mockupUrl: string = TAPETE_MOCKUP_URL
): Promise<string> {
  const W = 600
  const H = 400

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // 1. Draw rug mockup
  try {
    const tapete = await loadImage(mockupUrl)
    ctx.drawImage(tapete, 0, 0, W, H)
  } catch {
    const grad = ctx.createLinearGradient(0, 0, W, H)
    grad.addColorStop(0, '#6b4226')
    grad.addColorStop(1, '#4a2c1a')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)
  }

  // 2. Draw each pet
  const slots = getPetSlots(pets.length, W, H)

  for (let i = 0; i < pets.length; i++) {
    const pet  = pets[i]
    const slot = slots[i]
    if (!pet?.imageUrl) continue

    try {
      const img = await loadImage(pet.imageUrl)
      const { x, y, w, h } = slot

      ctx.save()

      if (pet.isDemo) {
        // ── Placeholder: circular clip, muted opacity ──────────────────────
        const cx     = x + w / 2
        const cy     = y + h / 2
        const radius = Math.min(w, h) / 2

        ctx.globalAlpha = 0.45

        // Dashed ring
        ctx.beginPath()
        ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(210, 170, 120, 0.4)'
        ctx.lineWidth = 2
        ctx.setLineDash([6, 4])
        ctx.stroke()
        ctx.setLineDash([])

        // Circular clip
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.clip()

        ctx.fillStyle = 'rgba(245, 225, 195, 0.85)'
        ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)

        const pad = radius * 0.08
        ctx.drawImage(img, cx - radius + pad, cy - radius + pad, (radius - pad) * 2, (radius - pad) * 2)

      } else if (pet.isGenerated) {
        // ── AI-generated art: multiply blend ──────────────────────────────
        // White pixels × rug_texture = rug_texture  → white "disappears"
        // Dark pixels  × rug_texture ≈ 0            → lines "tattoo" the rug

        // Subtle warm frame first (drawn in normal mode)
        ctx.strokeStyle = 'rgba(160, 120, 70, 0.4)'
        ctx.lineWidth = 1.5
        ctx.strokeRect(x - 1, y - 1, w + 2, h + 2)

        // Warm tint pre-boost: cream overlay so white areas read warm, not cold
        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 0.08
        ctx.fillStyle = '#d4a866'
        ctx.fillRect(x, y, w, h)
        ctx.globalAlpha = 1.0

        // Multiply: white disappears, dark lines "tattoo" the rug
        ctx.globalCompositeOperation = 'multiply'
        ctx.drawImage(img, x, y, w, h)

      } else {
        // ── Original photo (uploading / processing): show normally ─────────
        ctx.globalAlpha = 0.72
        ctx.drawImage(img, x, y, w, h)
      }

      ctx.restore()

      // Pet name label below the slot
      if (pet.name?.trim()) {
        const fontSize = Math.max(11, Math.round(Math.min(w, h) * 0.13))
        ctx.save()
        ctx.font = `bold ${fontSize}px 'Plus Jakarta Sans', sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        const labelX = x + w / 2
        const labelY = y + h + 8
        const textW  = ctx.measureText(pet.name).width
        const pillH  = fontSize * 1.4
        const pillPad = 8

        ctx.fillStyle = 'rgba(0,0,0,0.45)'
        fillRoundRect(ctx, labelX - textW / 2 - pillPad, labelY, textW + pillPad * 2, pillH, 4)

        ctx.fillStyle = '#f5e1c3'
        ctx.fillText(pet.name, labelX, labelY + 2)
        ctx.restore()
      }
    } catch {
      // Skip pet if image fails to load
    }
  }

  // 3. Phrase text at the bottom of the rug
  if (phrase?.trim()) {
    const text     = `"${phrase.trim()}"`
    const fontSize = Math.max(14, Math.min(20, W / text.length * 1.1))
    ctx.save()
    ctx.font = `italic ${fontSize}px 'Playfair Display', serif`
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'bottom'
    const textY = H - 14
    const textW = ctx.measureText(text).width

    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    fillRoundRect(ctx, W / 2 - textW / 2 - 12, textY - fontSize - 4, textW + 24, fontSize + 10, 6)

    ctx.fillStyle = '#f5e1c3'
    ctx.fillText(text, W / 2, textY)
    ctx.restore()
  }

  return canvas.toDataURL('image/jpeg', 0.92)
}