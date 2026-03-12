import { useState, useCallback, useRef } from 'react'
import { ConfiguratorState, DEFAULT_PET, Pet } from './types'
import { StepPets } from './StepPets'
import { StepSummary } from './StepSummary'
import { compressAndResizeImage } from '@/utils/imagePreprocessing'
import { generateTattooArt } from '@/utils/replicateApi'

interface PatapeteConfiguratorProps {
  product: any
}

export function PatapeteConfigurator({ product }: PatapeteConfiguratorProps) {
  const [state, setState] = useState<ConfiguratorState>({
    step: 1,
    style: 'dibujo',
    petCount: 1,
    pets: [{ ...DEFAULT_PET }, { ...DEFAULT_PET }, { ...DEFAULT_PET }],
    phrase: '',
    finalPreviewDataUrl: null,
    isGenerating: false,
    error: null,
  })

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

  // Accept an optional file override so we can auto-generate right after upload
  // (React state may not have updated yet when we call this)
  const handleGenerate = useCallback(async (petIndex: number, fileOverride?: File) => {
    const pet = state.pets[petIndex]
    const fileToUse = fileOverride ?? pet.photoFile
    if (!fileToUse) return

    const updatePet = (updates: Partial<Pet>) => {
      setState(s => {
        const pets = [...s.pets]
        pets[petIndex] = { ...pets[petIndex], ...updates }
        return { ...s, pets }
      })
    }

    try {
      // Step 1: Compress image client-side (max 1024×1024, PNG)
      updatePet({ isProcessingBg: true, isGeneratingArt: false, generatedArtUrl: null })
      const compressedBase64 = await compressAndResizeImage(fileToUse)
      updatePet({ isProcessingBg: false, isGeneratingArt: true })

      // Step 2: Full backend pipeline (BiRefNet → smart crop → FLUX Dev)
      const artUrl = await generateTattooArt(
        compressedBase64,
        pet.name || 'mascota',
        styleRef.current,   // ← always the latest style (avoids stale closure)
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
  // without needing to be recreated on every style change
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
          onStyleChange={handleStyleChange}
          onPetCountChange={handlePetCountChange}
          onPetChange={handlePetChange}
          onPhraseChange={handlePhraseChange}
          onGenerate={handleGenerate}
          onContinue={handleContinueToSummary}
          onPreviewReady={handlePreviewReady}
        />
      )}

      {state.step === 2 && (
        <StepSummary
          petCount={state.petCount}
          pets={state.pets}
          phrase={state.phrase}
          product={product}
          finalPreviewDataUrl={state.finalPreviewDataUrl}
          onBack={handleBack}
        />
      )}
    </div>
  )
}