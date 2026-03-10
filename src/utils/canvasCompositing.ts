/** Cross-browser rounded rect helper (avoids ctx.roundRect type issues) */
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
  isDemo?: boolean  // When true, renders at reduced opacity to signal it's a placeholder
}

const TAPETE_MOCKUP_URL = '/tapete-mockup.jpg'

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => {
      // Retry without crossOrigin for local files
      const img2 = new Image()
      img2.onload = () => resolve(img2)
      img2.onerror = reject
      img2.src = url
    }
    img.src = url
  })
}

interface PetSlot {
  cx: number
  cy: number
  radius: number
}

function getPetSlots(count: number, W: number, H: number): PetSlot[] {
  const centerY = H * 0.46
  switch (count) {
    case 1:
      return [{ cx: W / 2, cy: centerY, radius: Math.min(W, H) * 0.32 }]
    case 2:
      return [
        { cx: W * 0.31, cy: centerY, radius: Math.min(W, H) * 0.26 },
        { cx: W * 0.69, cy: centerY, radius: Math.min(W, H) * 0.26 },
      ]
    case 3:
    default:
      return [
        { cx: W * 0.19, cy: H * 0.52, radius: Math.min(W, H) * 0.20 },
        { cx: W * 0.50, cy: H * 0.42, radius: Math.min(W, H) * 0.24 },
        { cx: W * 0.81, cy: H * 0.52, radius: Math.min(W, H) * 0.20 },
      ]
  }
}

/**
 * Composites a tapete preview on a canvas and returns a dataURL.
 * Works for ICONO style (breed illustrations) and IA/VECTOR style (generated art).
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

  // 1. Draw tapete mockup
  try {
    const tapete = await loadImage(mockupUrl)
    ctx.drawImage(tapete, 0, 0, W, H)
  } catch {
    // Fallback: draw a brown texture
    const grad = ctx.createLinearGradient(0, 0, W, H)
    grad.addColorStop(0, '#6b4226')
    grad.addColorStop(1, '#4a2c1a')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)
  }

  // 2. Draw pet illustrations in circular frames
  const slots = getPetSlots(pets.length, W, H)

  for (let i = 0; i < pets.length; i++) {
    const pet = pets[i]
    const slot = slots[i]
    if (!pet?.imageUrl) continue

    try {
      const img = await loadImage(pet.imageUrl)
      const { cx, cy, radius } = slot

      ctx.save()

      // Demo images render at reduced opacity so users know it's a placeholder
      if (pet.isDemo) {
        ctx.globalAlpha = 0.55
      }

      // Draw subtle warm ring
      ctx.beginPath()
      ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2)
      ctx.strokeStyle = pet.isDemo ? 'rgba(210, 170, 120, 0.4)' : 'rgba(210, 170, 120, 0.7)'
      ctx.lineWidth = pet.isDemo ? 2 : 3
      ctx.setLineDash(pet.isDemo ? [6, 4] : [])
      ctx.stroke()
      ctx.setLineDash([])

      // Circular clip
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.clip()

      // Light warm background inside circle
      ctx.fillStyle = 'rgba(245, 225, 195, 0.85)'
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)

      // Draw illustration centered in circle
      const padding = radius * 0.08
      ctx.drawImage(img, cx - radius + padding, cy - radius + padding, (radius - padding) * 2, (radius - padding) * 2)

      ctx.restore()

      // Pet name label below circle
      if (pet.name && pet.name.trim()) {
        ctx.save()
        ctx.font = `bold ${Math.round(radius * 0.22)}px 'Plus Jakarta Sans', sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        const nameY = cy + radius + 6
        const textW = ctx.measureText(pet.name).width

        // Pill background
        ctx.fillStyle = 'rgba(0,0,0,0.45)'
        const pillH = radius * 0.28
        const pillPad = 8
        fillRoundRect(ctx, cx - textW / 2 - pillPad, nameY - 2, textW + pillPad * 2, pillH, 4)

        ctx.fillStyle = '#f5e1c3'
        ctx.fillText(pet.name, cx, nameY)
        ctx.restore()
      }
    } catch {
      // Skip this pet if image fails to load
    }
  }

  // 3. Phrase text at the bottom
  if (phrase && phrase.trim()) {
    const text = `"${phrase.trim()}"`
    const fontSize = Math.max(14, Math.min(20, W / text.length * 1.1))
    ctx.save()
    ctx.font = `italic ${fontSize}px 'Playfair Display', serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    const y = H - 14
    const textW = ctx.measureText(text).width

    // Background pill
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    fillRoundRect(ctx, W / 2 - textW / 2 - 12, y - fontSize - 4, textW + 24, fontSize + 10, 6)

    ctx.fillStyle = '#f5e1c3'
    ctx.fillText(text, W / 2, y)
    ctx.restore()
  }

  return canvas.toDataURL('image/jpeg', 0.92)
}