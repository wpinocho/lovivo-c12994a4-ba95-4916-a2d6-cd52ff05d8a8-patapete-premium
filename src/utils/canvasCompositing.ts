import { removeBackgroundFloodFill } from './imagePreprocessing'

export interface PetCompositeData {
  imageUrl: string
  name?: string
  /** No photo uploaded yet — renders a placeholder demo illustration */
  isDemo?: boolean
  /** AI-generated art — outer bg will be removed via flood-fill */
  isGenerated?: boolean
}

// Coir rug mockup — stored in repo public/ folder (same origin, no CORS issues)
const TAPETE_MOCKUP_URL = '/tapete-mockup.webp'

// ─── Layout config matching CanvasPreview.tsx exactly ─────────────────────────
type PetCount = 1 | 2 | 3
interface Layout { pets: { left: number }[]; petWidth: number; petTop: number }

const LAYOUTS: Record<PetCount, Layout> = {
  1: { pets: [{ left: 0.3632 }],                                              petWidth: 0.2739, petTop: 0.4526 },
  2: { pets: [{ left: 0.1806 }, { left: 0.5229 }],                           petWidth: 0.2739, petTop: 0.4526 },
  3: { pets: [{ left: 0.1528 }, { left: 0.3930 }, { left: 0.6381 }],         petWidth: 0.2055, petTop: 0.4921 },
}

// Font sizes matching cqw values in CanvasPreview.tsx (cqw = % of container width)
const FONT_PHRASE  = 0.055  // 5.5cqw
const FONT_NAME    = 0.045  // 4.5cqw
const FONT_PHRASE2 = 0.038  // 3.8cqw

// Vertical positions (matching CanvasPreview.tsx)
const TOP_PHRASE  = 0.3471  // 34.71% from top
const TOP_PHRASE2 = 0.70    // 70% from top

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => {
      // Retry without crossOrigin for blob: / data: / local files
      const img2 = new window.Image()
      img2.onload = () => resolve(img2)
      img2.onerror = reject
      img2.src = url
    }
    img.src = url
  })
}

/** Draw text with automatic line wrapping */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): void {
  const words = text.split(' ')
  let line = ''
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' '
    if (ctx.measureText(testLine).width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, y)
      line = words[n] + ' '
      y += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line.trim(), x, y)
}

// ─── Main composite function ──────────────────────────────────────────────────
/**
 * Renders a tapete preview canvas that exactly matches the HTML/CSS CanvasPreview component.
 *
 * Layout (matching CanvasPreview.tsx percentages):
 *   1. Rug mockup background (full canvas, scaled 1.12× from center)
 *   2. Top phrase at 34.71%  — font 5.5cqw
 *   3. Pet images at layout-specific positions (% of canvas)
 *   4. Pet names above each image
 *   5. Bottom phrase2 at 70% — font 3.8cqw
 */
export async function compositeRug(
  pets: PetCompositeData[],
  phrase?: string,
  phrase2?: string,
  mockupUrl: string = TAPETE_MOCKUP_URL
): Promise<string> {
  // Wait for custom fonts (Plus Jakarta Sans) to be available in canvas
  await document.fonts.ready

  const W = 600
  const H = 600

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Apply 1.12 scale from center — matching CSS: transform: scale(1.12) transformOrigin: center
  ctx.save()
  ctx.translate(W / 2, H / 2)
  ctx.scale(1.12, 1.12)
  ctx.translate(-W / 2, -H / 2)

  // ── 1. Draw rug mockup (cover fill) ───────────────────────────────────────
  try {
    const tapete = await loadImage(mockupUrl)
    const scale  = Math.max(W / tapete.naturalWidth, H / tapete.naturalHeight)
    const tw     = tapete.naturalWidth  * scale
    const th     = tapete.naturalHeight * scale
    ctx.drawImage(tapete, (W - tw) / 2, (H - th) / 2, tw, th)
  } catch {
    // Fallback gradient if mockup fails to load
    const grad = ctx.createLinearGradient(0, 0, W, H)
    grad.addColorStop(0, '#c8a46e')
    grad.addColorStop(1, '#a07840')
    ctx.fillStyle = grad
    ctx.fillRect(-W, -H, W * 3, H * 3)
  }

  // ── 2. Layout config ───────────────────────────────────────────────────────
  const count = Math.min(Math.max(pets.length, 1), 3) as PetCount
  const layout = LAYOUTS[count]
  const petWidthPx = Math.round(layout.petWidth * W)
  const petTopPx   = Math.round(layout.petTop * H)

  // ── 3. Top phrase (34.71% from top) ───────────────────────────────────────
  const phraseText = phrase?.trim() || 'Aquí manda'
  const phraseFontSize = Math.round(FONT_PHRASE * W)
  ctx.save()
  ctx.font         = `800 ${phraseFontSize}px 'Plus Jakarta Sans', sans-serif`
  ctx.fillStyle    = '#000000'
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText(phraseText, W / 2, Math.round(TOP_PHRASE * H))
  ctx.restore()

  // ── 4. Pet images with names ───────────────────────────────────────────────
  for (let i = 0; i < Math.min(pets.length, count); i++) {
    const pet = pets[i]
    const petLayoutItem = layout.pets[i]
    if (!petLayoutItem || !pet?.imageUrl) continue

    const petLeftPx = Math.round(petLayoutItem.left * W)

    try {
      // Flood-fill removes outer white background — only needed for AI-generated JPEGs.
      // Demo images already have transparent backgrounds, skip processing.
      const needsBgRemoval = pet.isGenerated && !pet.isDemo
      const drawUrl = needsBgRemoval
        ? await removeBackgroundFloodFill(pet.imageUrl)
        : pet.imageUrl

      const img = await loadImage(drawUrl)

      // h-auto equivalent: maintain natural aspect ratio
      const aspectRatio  = img.naturalHeight / img.naturalWidth
      const petHeightPx  = Math.round(petWidthPx * aspectRatio)

      // ── Pet name above the image ─────────────────────────────────────────
      // CSS: top:0, transform: translateY(calc(-100% + 14px))
      // → name bottom = petTopPx + 14px
      if (pet.name?.trim()) {
        const nameFontSize = Math.round(FONT_NAME * W)
        ctx.save()
        ctx.font         = `800 ${nameFontSize}px 'Plus Jakarta Sans', sans-serif`
        ctx.fillStyle    = '#000000'
        ctx.textAlign    = 'center'
        ctx.textBaseline = 'bottom'
        // +2.5cqw below pet top matching CanvasPreview.tsx translateY(calc(-100% + 2.5cqw))
        ctx.fillText(pet.name.trim(), petLeftPx + petWidthPx / 2, petTopPx + Math.round(0.025 * W))
        ctx.restore()
      }

      // ── Draw pet image ────────────────────────────────────────────────────
      ctx.drawImage(img, petLeftPx, petTopPx, petWidthPx, petHeightPx)
    } catch {
      // Skip pet if image fails to load
    }
  }

  // ── 5. Bottom phrase2 (70% from top) ──────────────────────────────────────
  const phrase2Text = phrase2?.trim() || 'No toques... ya sabemos que estás aquí'
  const phrase2FontSize = Math.round(FONT_PHRASE2 * W)
  ctx.save()
  ctx.font         = `800 ${phrase2FontSize}px 'Plus Jakarta Sans', sans-serif`
  ctx.fillStyle    = '#000000'
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'top'
  // 8% padding on each side = 84% max width (matching padding: '0 8%' in CSS)
  wrapText(ctx, phrase2Text, W / 2, Math.round(TOP_PHRASE2 * H), W * 0.84, phrase2FontSize * 1.2)
  ctx.restore()

  ctx.restore() // restore the 1.12 scale transform

  return canvas.toDataURL('image/jpeg', 0.92)
}