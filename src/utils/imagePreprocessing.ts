/**
 * Client-side image preprocessing before sending to the backend.
 * Resizes to max 1024×1024 conserving aspect ratio and converts to PNG base64.
 */

export async function compressAndResizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      const MAX = 1024
      let { width, height } = img

      if (width > MAX || height > MAX) {
        if (width >= height) {
          height = Math.round((height * MAX) / width)
          width = MAX
        } else {
          width = Math.round((width * MAX) / height)
          height = MAX
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      // PNG preserves quality for edge detection; strip the data URI prefix
      const dataUrl = canvas.toDataURL('image/png')
      resolve(dataUrl.replace(/^data:image\/png;base64,/, ''))
    }

    img.onerror = () => reject(new Error('No se pudo cargar la imagen para comprimir'))
    img.src = objectUrl
  })
}