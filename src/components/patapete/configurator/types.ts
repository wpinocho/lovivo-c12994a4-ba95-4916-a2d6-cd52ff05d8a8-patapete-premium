export type Style = 'tattoo' | 'vector'

export interface Pet {
  photoFile: File | null
  photoPreviewUrl: string | null
  processedImageUrl: string | null
  generatedArtUrl: string | null
  isProcessingBg: boolean
  isGeneratingArt: boolean
  name: string
}

export interface ConfiguratorState {
  step: 1 | 2
  style: Style
  petCount: 1 | 2 | 3
  pets: Pet[]
  phrase: string
  finalPreviewDataUrl: string | null
  isGenerating: boolean
  error: string | null
}

export const DEFAULT_PET: Pet = {
  photoFile: null,
  photoPreviewUrl: null,
  processedImageUrl: null,
  generatedArtUrl: null,
  isProcessingBg: false,
  isGeneratingArt: false,
  name: '',
}

export const STYLE_LABELS: Record<Style, string> = {
  tattoo: 'Tatuaje IA',
  vector: 'Vector',
}

export const PRICES: Record<Style, Record<1 | 2 | 3, number>> = {
  tattoo: { 1: 649, 2: 799, 3: 949 },
  vector: { 1: 549, 2: 699, 3: 849 },
}