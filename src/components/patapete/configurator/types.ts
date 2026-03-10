export type Style = 'tattoo' | 'vector' | 'icon'
export type AnimalType = 'dog' | 'cat'

export interface Pet {
  // Icon style
  animalType: AnimalType
  breedId: string
  // IA/Vector style
  photoFile: File | null
  photoPreviewUrl: string | null
  processedImageUrl: string | null
  generatedArtUrl: string | null
  isProcessingBg: boolean
  isGeneratingArt: boolean
  // Common
  name: string
}

export interface ConfiguratorState {
  step: 1 | 2 | 3
  style: Style | null
  petCount: 1 | 2 | 3
  pets: Pet[]
  phrase: string
  finalPreviewDataUrl: string | null
  isGenerating: boolean
  error: string | null
}

export const DEFAULT_PET: Pet = {
  animalType: 'dog',
  breedId: 'labrador',
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
  icon: 'Ícono',
}

export const PRICES: Record<Style, Record<1 | 2 | 3, number>> = {
  tattoo: { 1: 649, 2: 799, 3: 949 },
  vector: { 1: 549, 2: 699, 3: 849 },
  icon:   { 1: 449, 2: 599, 3: 749 },
}