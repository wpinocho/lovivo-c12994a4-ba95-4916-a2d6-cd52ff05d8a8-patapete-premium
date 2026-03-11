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

// New lighter coir mat for clean multiply blend
const TAPETE_MOCKUP_URL = 'https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773256082834-gf5g5a3no07.webp'

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

// ─── Square slot layout ────────────────────────────────────────────────────────
interface PetSlot { x: number; y: number; w: number; h: number }

function getPetSlots(count: number, W: number, H: number): PetSlot[] {
  const cy = Math.round(H * 0.47) // vertical center — slightly above mid on square canvas

  switch (count) {
    case 1: {
      const s = Math.round(H * 0.58)          // 348 px at H=600 — big portrait
      return [{ x: Math.round((W - s) / 2), y: Math.round(cy - s / 2), w: s, h: s }]
    }
    case 2: {
      const s   = Math.round(H * 0.44)        // 264 px
      const gap = Math.round(W * 0.04)        // 24 px
      const startX = Math.round((W - (s * 2 + gap)) / 2)
      const y = Math.round(cy - s / 2)
      return [
        { x: startX,           y, w: s, h: s },
        { x: startX + s + gap, y, w: s, h: s },
      ]
    }
    case 3:
    default: {
      const s   = Math.round(H * 0.30)        // 180 px
      const gap = Math.round(W * 0.024)       // 14 px
      const startX = Math.round((W - (s * 3 + gap * 2)) / 2)
      const y = Math.round(cy - s / 2)
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
 *
 * The canvas is 600×600 (square). The rug mockup is drawn with object-cover
 * (center-cropped to fill) so there are no letterbox gaps.
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

  // 1. Draw rug mockup — object-cover (center crop to fill square)
  try {
    const tapete = await loadImage(mockupUrl)
    const scale  = Math.max(W / tapete.naturalWidth, H / tapete.naturalHeight)
    const tw     = tapete.naturalWidth  * scale
    const th     = tapete.naturalHeight * scale
    ctx.drawImage(tapete, (W - tw) / 2, (H - th) / 2, tw, th)
  } catch {
    // Fallback: warm gradient if image fails
    const grad = ctx.createLinearGradient(0, 0, W, H)
    grad.addColorStop(0, '#c8a46e')
    grad.addColorStop(1, '#a07840')
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
        // ── AI-generated art: pure multiply blend ─────────────────────────
        // Light rug × white art background = rug texture (white is invisible)
        // Light rug × black lines ≈ dark (lines "tattoo" the mat)
        // No pre-tint or stroke needed — the light mat handles it natively
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
        const fontSize = Math.max(11, Math.round(Math.min(w, h) * 0.12))
        ctx.save()
        ctx.font = `bold ${fontSize}px 'Plus Jakarta Sans', sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        const labelX = x + w / 2
        const labelY = y + h + 8
        const textW  = ctx.measureText(pet.name).width
        const pillH  = fontSize * 1.4
        const pillPad = 8

        ctx.fillStyle = 'rgba(0,0,0,0.40)'
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
    const fontSize = Math.max(14, Math.min(22, W / text.length * 1.1))
    ctx.save()
    ctx.font = `italic ${fontSize}px 'Playfair Display', serif`
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'bottom'
    const textY = H - 18
    const textW = ctx.measureText(text).width

    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    fillRoundRect(ctx, W / 2 - textW / 2 - 14, textY - fontSize - 4, textW + 28, fontSize + 10, 6)

    ctx.fillStyle = '#f5e1c3'
    ctx.fillText(text, W / 2, textY)
    ctx.restore()
  }

  return canvas.toDataURL('image/jpeg', 0.92)
}