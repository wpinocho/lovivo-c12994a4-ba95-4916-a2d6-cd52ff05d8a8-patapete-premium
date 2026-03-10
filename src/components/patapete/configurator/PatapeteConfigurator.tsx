import { useState, useCallback } from 'react'
import { ConfiguratorState, DEFAULT_PET, Pet, Style } from './types'
import { StepPets } from './StepPets'
import { StepSummary } from './StepSummary'
import { removeBackground } from '@/utils/backgroundRemoval'
import { applyVectorEffect } from '@/utils/vectorFilter'
import { generateTattooArt } from '@/utils/replicateApi'

interface PatapeteConfiguratorProps {
  product: any
}

export function PatapeteConfigurator({ product }: PatapeteConfiguratorProps) {
  const [state, setState] = useState<ConfiguratorState>({
    step: 1,
    style: 'tattoo',
    petCount: 1,
    pets: [{ ...DEFAULT_PET }, { ...DEFAULT_PET }, { ...DEFAULT_PET }],
    phrase: '',
    finalPreviewDataUrl: null,
    isGenerating: false,
    error: null,
  })

  const handleStyleChange = useCallback((style: Style) => {
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

  const handleGenerate = useCallback(async (petIndex: number) => {
    const pet = state.pets[petIndex]
    const style = state.style
    if (!pet.photoFile) return

    const updatePet = (updates: Partial<Pet>) => {
      setState(s => {
        const pets = [...s.pets]
        pets[petIndex] = { ...pets[petIndex], ...updates }
        return { ...s, pets }
      })
    }

    try {
      updatePet({ isProcessingBg: true, isGeneratingArt: false })
      const removedBgUrl = await removeBackground(pet.photoFile, (progress, status) => {
        console.log(`[BG Removal] ${progress}% - ${status}`)
      })
      updatePet({ processedImageUrl: removedBgUrl, isProcessingBg: false })

      updatePet({ isGeneratingArt: true })

      let artUrl: string
      if (style === 'vector') {
        artUrl = await applyVectorEffect(removedBgUrl)
      } else {
        artUrl = await generateTattooArt(
          removedBgUrl,
          pet.name || 'mascota',
          (status) => console.log(`[IA] ${status}`)
        )
      }

      updatePet({ generatedArtUrl: artUrl, isGeneratingArt: false })
    } catch (err) {
      console.error('Error generating art:', err)
      updatePet({ isProcessingBg: false, isGeneratingArt: false })
      setState(s => ({
        ...s,
        error: err instanceof Error ? err.message : 'Error al generar el arte. Intenta de nuevo.',
      }))
    }
  }, [state.pets, state.style])

  const handleContinueToSummary = useCallback(() => {
    setState(s => ({ ...s, step: 2, error: null }))
  }, [])

  const handleBack = useCallback(() => {
    setState(s => ({ ...s, step: 1 }))
  }, [])

  const handlePreviewReady = useCallback((dataUrl: string) => {
    setState(s => ({ ...s, finalPreviewDataUrl: dataUrl }))
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 py-4">
      {/* Error message */}
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
          style={state.style}
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