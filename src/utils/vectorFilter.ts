/**
 * Applies a flat vector-like visual effect to an image (dataURL → dataURL).
 * Uses posterization and limited color palette to achieve a sticker/vector look.
 */
export function applyVectorEffect(imageDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!

      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        // Skip fully transparent pixels
        if (data[i + 3] < 10) continue

        // Posterize to 4 levels
        const levels = 4
        data[i]     = Math.round(data[i]     / 255 * (levels - 1)) / (levels - 1) * 255
        data[i + 1] = Math.round(data[i + 1] / 255 * (levels - 1)) / (levels - 1) * 255
        data[i + 2] = Math.round(data[i + 2] / 255 * (levels - 1)) / (levels - 1) * 255

        // Boost saturation slightly
        const r = data[i], g = data[i + 1], b = data[i + 2]
        const gray = 0.299 * r + 0.587 * g + 0.114 * b
        const sat = 1.4
        data[i]     = Math.min(255, Math.max(0, gray + (r - gray) * sat))
        data[i + 1] = Math.min(255, Math.max(0, gray + (g - gray) * sat))
        data[i + 2] = Math.min(255, Math.max(0, gray + (b - gray) * sat))

        // Slightly reduce near-white areas to make them more visible
        if (data[i] > 230 && data[i + 1] > 230 && data[i + 2] > 230) {
          data[i] = data[i + 1] = data[i + 2] = 200
        }
      }

      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = imageDataUrl
  })
}