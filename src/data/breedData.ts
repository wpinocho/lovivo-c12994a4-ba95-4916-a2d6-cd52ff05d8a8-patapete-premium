export type AnimalType = 'dog' | 'cat'

export interface Breed {
  id: string
  label: string
  animalType: AnimalType
  imageUrl: string
}

const BASE = 'https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/product-images/c12994a4-ba95-4916-a2d6-cd52ff05d8a8/'

export const BREEDS: Breed[] = [
  // Perros
  { id: 'labrador',       label: 'Labrador',        animalType: 'dog', imageUrl: `${BASE}dog-labrador.png` },
  { id: 'golden',         label: 'Golden Retriever', animalType: 'dog', imageUrl: `${BASE}dog-golden.png` },
  { id: 'chihuahua',      label: 'Chihuahua',        animalType: 'dog', imageUrl: `${BASE}dog-chihuahua.png` },
  { id: 'poodle',         label: 'Poodle',           animalType: 'dog', imageUrl: `${BASE}dog-poodle.png` },
  { id: 'dachshund',      label: 'Dachshund',        animalType: 'dog', imageUrl: `${BASE}dog-dachshund.png` },
  { id: 'bulldog',        label: 'Bulldog',          animalType: 'dog', imageUrl: `${BASE}dog-bulldog.png` },
  { id: 'pastor-aleman',  label: 'Pastor Alemán',    animalType: 'dog', imageUrl: `${BASE}dog-pastor-aleman.png` },
  { id: 'beagle',         label: 'Beagle',           animalType: 'dog', imageUrl: `${BASE}dog-beagle.png` },
  { id: 'husky',          label: 'Husky',            animalType: 'dog', imageUrl: `${BASE}dog-husky.png` },
  { id: 'schnauzer',      label: 'Schnauzer',        animalType: 'dog', imageUrl: `${BASE}dog-schnauzer.png` },
  { id: 'yorkshire',      label: 'Yorkshire',        animalType: 'dog', imageUrl: `${BASE}dog-yorkshire.png` },
  { id: 'frenchbulldog',  label: 'Bulldog Francés',  animalType: 'dog', imageUrl: `${BASE}dog-frenchbulldog.png` },
  // Gatos
  { id: 'cat-mestizo',    label: 'Mestizo',          animalType: 'cat', imageUrl: `${BASE}cat-mestizo.png` },
  { id: 'cat-siames',     label: 'Siamés',           animalType: 'cat', imageUrl: `${BASE}cat-siames.png` },
  { id: 'cat-persa',      label: 'Persa',            animalType: 'cat', imageUrl: `${BASE}cat-persa.png` },
]

export const DOG_BREEDS = BREEDS.filter(b => b.animalType === 'dog')
export const CAT_BREEDS = BREEDS.filter(b => b.animalType === 'cat')

export const getBreedById = (id: string): Breed | undefined =>
  BREEDS.find(b => b.id === id)