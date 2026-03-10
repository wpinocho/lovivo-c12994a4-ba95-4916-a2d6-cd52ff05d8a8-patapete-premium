import { useState, useCallback } from 'react'
import { ConfiguratorState, DEFAULT_PET, Pet, Style } from './types'
import { StepStyle } from './StepStyle'
import { StepPets } from './StepPets'
import { StepSummary } from './StepSummary'
import { removeBackground } from '@/utils/backgroundRemoval'
import { applyVectorEffect } from '@/utils/vectorFilter'
import { generateTattooArt } from '@/utils/replicateApi'
import { cn } from '@/lib/utils'

const STEPS = ['Elige tu estilo', 'Configura', 'Resumen']

interface PatapeteConfiguratorProps {
  product: any
}

export function PatapeteConfigurator({ product }: PatapeteConfiguratorProps) {
  const [state, setState] = useState<ConfiguratorState>({
    step: 1,
    style: null,
    petCount: 1,
    pets: [{ ...DEFAULT_PET }, { ...DEFAULT_PET }, { ...DEFAULT_PET }],
    phrase: '',
    finalPreviewDataUrl: null,
    isGenerating: false,
    error: null,
  })

  // Select a style and advance
  const handleStyleSelect = useCallback((style: Style) => {
    setState(s => ({ ...s, style, step: 2 }))
  }, [])

  // Pet count change — preserve existing pets
  const handlePetCountChange = useCallback((count: 1 | 2 | 3) => {
    setState(s => ({ ...s, petCount: count }))
  }, [])

  // Update a single pet
  const handlePetChange = useCallback((index: number, updates: Partial<Pet>) => {
    setState(s => {
      const pets = [...s.pets]
      pets[index] = { ...pets[index], ...updates }
      return { ...s, pets }
    })
  }, [])

  // Phrase update
  const handlePhraseChange = useCallback((phrase: string) => {
    setState(s => ({ ...s, phrase }))
  }, [])

  // Generate art for a pet (background removal + IA or vector)
  const handleGenerate = useCallback(async (petIndex: number) => {
    const pet = state.pets[petIndex]
    const style = state.style
    if (!pet.photoFile || !style || style === 'icon') return

    const updatePet = (updates: Partial<Pet>) => {
      setState(s => {
        const pets = [...s.pets]
        pets[petIndex] = { ...pets[petIndex], ...updates }
        return { ...s, pets }
      })
    }

    try {
      // Step 1: Background removal
      updatePet({ isProcessingBg: true, isGeneratingArt: false })
      const removedBgUrl = await removeBackground(pet.photoFile, (progress, status) => {
        console.log(`[BG Removal] ${progress}% - ${status}`)
      })
      updatePet({ processedImageUrl: removedBgUrl, isProcessingBg: false })

      // Step 2: Art generation
      updatePet({ isGeneratingArt: true })

      let artUrl: string
      if (style === 'vector') {
        artUrl = await applyVectorEffect(removedBgUrl)
      } else {
        // Tattoo IA
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

  // Step navigation
  const handleContinueToSummary = useCallback(() => {
    setState(s => ({ ...s, step: 3, error: null }))
  }, [])

  const handleBack = useCallback(() => {
    setState(s => ({ ...s, step: Math.max(1, s.step - 1) as 1 | 2 | 3 }))
  }, [])

  const handlePreviewReady = useCallback((dataUrl: string) => {
    setState(s => ({ ...s, finalPreviewDataUrl: dataUrl }))
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 py-4">
      {/* Progress indicator */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          {STEPS.map((label, i) => {
            const stepNum = (i + 1) as 1 | 2 | 3
            const isActive = state.step === stepNum
            const isDone = state.step > stepNum
            return (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                    isActive ? 'bg-primary text-primary-foreground shadow-md' :
                    isDone ? 'bg-primary/20 text-primary' :
                    'bg-muted text-muted-foreground'
                  )}>
                    {isDone ? '✓' : stepNum}
                  </div>
                  <span className={cn(
                    'text-xs font-medium hidden sm:block',
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    'h-0.5 flex-1 mx-3 transition-all',
                    state.step > stepNum ? 'bg-primary/40' : 'bg-muted'
                  )} />
                )}
              </div>
            )
          })}
        </div>
      </div>

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

      {/* Step content */}
      {state.step === 1 && (
        <StepStyle
          selected={state.style}
          onSelect={handleStyleSelect}
        />
      )}

      {state.step === 2 && state.style && (
        <StepPets
          style={state.style}
          petCount={state.petCount}
          pets={state.pets}
          phrase={state.phrase}
          onPetCountChange={handlePetCountChange}
          onPetChange={handlePetChange}
          onPhraseChange={handlePhraseChange}
          onGenerate={handleGenerate}
          onContinue={handleContinueToSummary}
          onPreviewReady={handlePreviewReady}
        />
      )}

      {state.step === 3 && state.style && (
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