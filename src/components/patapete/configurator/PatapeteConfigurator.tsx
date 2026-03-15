import { useState, useCallback, useRef, useEffect } from 'react'
import { ConfiguratorState, DEFAULT_PET, Pet, Style } from './types'
import { StepPets } from './StepPets'
import { StepSummary } from './StepSummary'
import { compressAndResizeImage } from '@/utils/imagePreprocessing'
import { generateTattooArt } from '@/utils/replicateApi'

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

export function PatapeteConfigurator({ product }: PatapeteConfiguratorProps) {
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

  const handleContinueToSummary = useCallback(() => {
    setState(s => ({ ...s, step: 2, error: null, finalPreviewDataUrl: finalPreviewRef.current }))
  }, [])

  const handleBack = useCallback(() => {
    setState(s => ({ ...s, step: 1 }))
  }, [])

  // Use a ref for style so handleGenerate always reads the latest value
  const styleRef = useRef(state.style)
  styleRef.current = state.style

  const finalPreviewRef = useRef<string | null>(null)

  const handlePreviewReady = useCallback((dataUrl: string) => {
    finalPreviewRef.current = dataUrl
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 py-4">
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
          onContinue={handleContinueToSummary}
          onPreviewReady={handlePreviewReady}
        />
      )}

      {state.step === 2 && (
        <StepSummary
          style={state.style}
          petCount={state.petCount}
          pets={state.pets}
          phrase={state.phrase}
          phrase2={state.phrase2}
          product={product}
          finalPreviewDataUrl={state.finalPreviewDataUrl}
          onBack={handleBack}
        />
      )}
    </div>
  )
}