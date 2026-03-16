export type Style = 'dibujo' | 'icono'

export interface Pet {
  photoFile: File | null
  photoPreviewUrl: string | null
  photoBase64: string | null       // compressed base64 (no data-URL prefix) — persisted to localStorage
  processedImageUrl: string | null
  generatedArtUrl: string | null
  isProcessingBg: boolean
  isGeneratingArt: boolean
  name: string
  progressMessage: string
}

export interface ConfiguratorState {
  step: 1 | 2
  style: Style
  petCount: 1 | 2 | 3
  pets: Pet[]
  phrase: string
  phrase2: string
  finalPreviewDataUrl: string | null
  isGenerating: boolean
  error: string | null
}

export const DEFAULT_PET: Pet = {
  photoFile: null,
  photoPreviewUrl: null,
  photoBase64: null,
  processedImageUrl: null,
  generatedArtUrl: null,
  isProcessingBg: false,
  isGeneratingArt: false,
  name: '',
  progressMessage: '',
}

export const STYLE_LABELS: Record<Style, string> = {
  dibujo: 'Dibujo',
  icono: 'Icono',
}

export const PRICES: Record<Style, Record<1 | 2 | 3, number>> = {
  dibujo: { 1: 649, 2: 799, 3: 949 },
  icono:  { 1: 649, 2: 799, 3: 949 },
}