import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfiguratorState, DEFAULT_PET, Pet, Style } from './types'
import { StepPets } from './StepPets'
import { compressAndResizeImage } from '@/utils/imagePreprocessing'
import { generateTattooArt } from '@/utils/replicateApi'
import { useCart } from '@/contexts/CartContext'
import { useCartUISafe } from '@/components/CartProvider'
import { STYLE_LABELS } from './types'

// ─── localStorage persistence ─────────────────────────────────────────────────
const STORAGE_KEY = 'patapete_v1'

interface PersistedPet {
  name: string
  photoBase64: string | null
  generatedArtUrl: string | null
}

interface PersistedState {
  style: Style
  petCount: 1 | 2 | 3
  phrase: string
  phrase2: string
  pets: PersistedPet[]
}

function loadFromStorage(): Partial<ConfiguratorState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const saved: PersistedState = JSON.parse(raw)
    const pets = Array.from({ length: 3 }, (_, i) => {
      const p = saved.pets?.[i]
      if (!p) return { ...DEFAULT_PET }
      return {
        ...DEFAULT_PET,
        name: p.name || '',
        photoBase64: p.photoBase64 || null,
        // Reconstruct a data-URL for display from the stored base64
        photoPreviewUrl: p.photoBase64
          ? `data:image/png;base64,${p.photoBase64}`
          : null,
        generatedArtUrl: p.generatedArtUrl || null,
      }
    })
    return {
      style: saved.style || 'dibujo',
      petCount: saved.petCount || 1,
      phrase: saved.phrase || '',
      phrase2: saved.phrase2 || '',
      step: 1, // always start at step 1 on reload
      pets,
    }
  } catch {
    return null
  }
}

function saveToStorage(state: ConfiguratorState) {
  try {
    const persisted: PersistedState = {
      style: state.style,
      petCount: state.petCount,
      phrase: state.phrase,
      phrase2: state.phrase2,
      pets: state.pets.map(p => ({
        name: p.name,
        photoBase64: p.photoBase64 || null,
        generatedArtUrl: p.generatedArtUrl || null,
      })),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
  } catch {
    // localStorage may be full — silently ignore
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
interface PatapeteConfiguratorProps {
  product: any
}

// Real variant IDs from the product
const VARIANT_IDS: Record<1 | 2 | 3, string> = {
  1: '28fc993c-e638-459b-9a00-08abacdc9f32',
  2: '1aee4582-040b-477a-b335-e99446fa76c7',
  3: '5f7e007d-b30e-44c8-baa6-5aa03edb23ad',
}

export function PatapeteConfigurator({ product }: PatapeteConfiguratorProps) {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const cartUI = useCartUISafe()
  const openCart = cartUI?.openCart ?? (() => {})
  const saved = loadFromStorage()

  const [state, setState] = useState<ConfiguratorState>({
    step: 1,
    style: 'dibujo',
    petCount: 1,
    pets: [{ ...DEFAULT_PET }, { ...DEFAULT_PET }, { ...DEFAULT_PET }],
    phrase: '',
    phrase2: '',
    finalPreviewDataUrl: null,
    isGenerating: false,
    error: null,
    ...(saved || {}),
  })

  // Persist state to localStorage on every change
  useEffect(() => {
    saveToStorage(state)
  }, [state])

  const handleStyleChange = useCallback((style: import('./types').Style) => {
    setState(s => ({ ...s, style }))
  }, [])

  const handlePetCountChange = useCallback((count: 1 | 2 | 3) => {
    setState(s => ({ ...s, petCount: count }))
  }, [])

  const handlePetChange = useCallback((index: number, updates: Partial<Pet>) => {
    setState(s => {
      const pets = [...s.pets]
      pets[index] = { ...pets[index], ...updates }
      return { ...s, pets }
    })
  }, [])

  const handlePhraseChange = useCallback((phrase: string) => {
    setState(s => ({ ...s, phrase }))
  }, [])

  const handlePhrase2Change = useCallback((phrase2: string) => {
    setState(s => ({ ...s, phrase2 }))
  }, [])

  // Accept an optional file override so we can auto-generate right after upload.
  // Also handles retry after refresh (file = undefined, photoBase64 available in state).
  const handleGenerate = useCallback(async (petIndex: number, fileOverride?: File) => {
    const pet = state.pets[petIndex]
    const fileToUse = fileOverride ?? pet.photoFile

    // Need at least a file or a stored base64 to proceed
    if (!fileToUse && !pet.photoBase64) return

    const updatePet = (updates: Partial<Pet>) => {
      setState(s => {
        const pets = [...s.pets]
        pets[petIndex] = { ...pets[petIndex], ...updates }
        return { ...s, pets }
      })
    }

    try {
      let compressedBase64: string

      if (fileToUse) {
        // Fresh upload: compress client-side and store base64 for persistence
        updatePet({ isProcessingBg: true, isGeneratingArt: false, generatedArtUrl: null })
        compressedBase64 = await compressAndResizeImage(fileToUse)
        updatePet({ isProcessingBg: false, isGeneratingArt: true, photoBase64: compressedBase64 })
      } else {
        // Retry after refresh: reuse stored base64 (skip re-compression)
        compressedBase64 = pet.photoBase64!
        updatePet({ isGeneratingArt: true, generatedArtUrl: null })
      }

      // Full backend pipeline (BiRefNet → smart crop → FLUX 2 Pro)
      const artUrl = await generateTattooArt(
        compressedBase64,
        pet.name || 'mascota',
        styleRef.current,
        (status) => console.log(`[IA] ${status}`)
      )

      updatePet({ generatedArtUrl: artUrl, isGeneratingArt: false })
    } catch (err) {
      console.error('Error generating art:', err)
      updatePet({ isProcessingBg: false, isGeneratingArt: false })
      setState(s => ({
        ...s,
        error: err instanceof Error ? err.message : 'Error al generar el arte. Intenta de nuevo.',
      }))
    }
  }, [state.pets])

  const handleAddToCart = useCallback(() => {
    if (!product) return
    const currentState = state
    const variantId = VARIANT_IDS[currentState.petCount]
    const variant = product?.variants?.find((v: any) => v.id === variantId)

    const customization = {
      style: STYLE_LABELS[currentState.style],
      petCount: currentState.petCount,
      pets: currentState.pets.slice(0, currentState.petCount).map((p, i) => ({
        name: p.name || `Mascota ${i + 1}`,
        ...(p.generatedArtUrl ? { artUrl: p.generatedArtUrl } : {}),
      })),
      phrase: currentState.phrase,
      phrase2: currentState.phrase2,
      previewDataUrl: finalPreviewRef.current,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem(`patapete_order_${Date.now()}`, JSON.stringify(customization))

    addItem(product, variant)
    openCart()
  }, [product, state, addItem, openCart])

  const handleOrderNow = useCallback(() => {
    if (!product) return
    const currentState = state
    const variantId = VARIANT_IDS[currentState.petCount]
    const variant = product?.variants?.find((v: any) => v.id === variantId)

    // Save customization metadata
    const customization = {
      style: STYLE_LABELS[currentState.style],
      petCount: currentState.petCount,
      pets: currentState.pets.slice(0, currentState.petCount).map((p, i) => ({
        name: p.name || `Mascota ${i + 1}`,
        ...(p.generatedArtUrl ? { artUrl: p.generatedArtUrl } : {}),
        ...(p.photoPreviewUrl && !p.generatedArtUrl ? { photoUrl: p.photoPreviewUrl } : {}),
      })),
      phrase: currentState.phrase,
      phrase2: currentState.phrase2,
      previewDataUrl: finalPreviewRef.current,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem(`patapete_order_${Date.now()}`, JSON.stringify(customization))

    addItem(product, variant)
    navigate('/pagar')
  }, [product, state, addItem, navigate])

  // Use a ref for style so handleGenerate always reads the latest value
  const styleRef = useRef(state.style)
  styleRef.current = state.style

  const finalPreviewRef = useRef<string | null>(null)

  const handlePreviewReady = useCallback((dataUrl: string) => {
    finalPreviewRef.current = dataUrl
  }, [])

  return (
    <div className="w-full space-y-8 py-4">
      {state.error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4 text-sm">
          {state.error}
          <button
            onClick={() => setState(s => ({ ...s, error: null }))}
            className="ml-2 underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {state.step === 1 && (
        <StepPets
          style={state.style}
          petCount={state.petCount}
          pets={state.pets}
          phrase={state.phrase}
          phrase2={state.phrase2}
          onStyleChange={handleStyleChange}
          onPetCountChange={handlePetCountChange}
          onPetChange={handlePetChange}
          onPhraseChange={handlePhraseChange}
          onPhrase2Change={handlePhrase2Change}
          onGenerate={handleGenerate}
          onAddToCart={handleAddToCart}
          onOrderNow={handleOrderNow}
          onPreviewReady={handlePreviewReady}
        />
      )}
    </div>
  )
}