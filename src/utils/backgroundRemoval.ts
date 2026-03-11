/**
 * @deprecated Background removal now runs in the backend edge function
 * using BiRefNet via Replicate. This file is kept as a no-op to avoid
 * breaking any stale imports during the transition.
 */

export type ProgressCallback = (progress: number, status: string) => void

/** @deprecated Use generateTattooArt() from replicateApi.ts instead */
export async function removeBackground(
  _imageFile: File,
  _onProgress?: ProgressCallback
): Promise<string> {
  throw new Error('removeBackground is deprecated — bg removal now runs server-side via BiRefNet')
}