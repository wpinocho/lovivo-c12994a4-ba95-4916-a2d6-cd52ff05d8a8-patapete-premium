/**
 * Background removal using @imgly/background-removal
 * Runs entirely in the browser via WebAssembly — no API key needed.
 */

export type ProgressCallback = (progress: number, status: string) => void

export async function removeBackground(
  imageFile: File,
  onProgress?: ProgressCallback
): Promise<string> {
  onProgress?.(5, 'Cargando motor de recorte...')

  try {
    const { removeBackground: imglyRemoveBackground } = await import('@imgly/background-removal')

    onProgress?.(15, 'Analizando imagen...')

    const blob = await imglyRemoveBackground(imageFile, {
      progress: (key: string, current: number, total: number) => {
        const pct = Math.round((current / total) * 70) + 15
        const label =
          key === 'compute:inference' ? 'Detectando mascota...' :
          key === 'fetch:model' ? 'Descargando modelo IA...' :
          'Procesando...'
        onProgress?.(Math.min(pct, 85), label)
      },
    })

    onProgress?.(95, 'Finalizando recorte...')

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    throw new Error(`Error quitando el fondo: ${error instanceof Error ? error.message : 'Error desconocido'}`)
  }
}