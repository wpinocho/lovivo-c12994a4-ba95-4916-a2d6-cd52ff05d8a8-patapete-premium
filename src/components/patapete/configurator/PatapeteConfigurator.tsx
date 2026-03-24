import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfiguratorState, DEFAULT_PET, Pet, Style } from './types'
import { StepPets } from './StepPets'
import { compressAndResizeImage } from '@/utils/imagePreprocessing'
import { generateTattooArt } from '@/utils/replicateApi'
import { useCart, CartProductItem } from '@/contexts/CartContext'
import { useCartUISafe } from '@/components/CartProvider'
import { STYLE_LABELS } from './types'
import { userSupabase } from '@/integrations/supabase/client'
import { trackCustomEvent, trackAddToCart, trackInitiateCheckout } from '@/lib/tracking-utils'
import { createCheckoutFromCart, updateCheckout } from '@/lib/checkout'
import { useCheckoutState } from '@/hooks/useCheckoutState'
import { useSettings } from '@/contexts/SettingsContext'
import { STORE_ID } from '@/lib/config'

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
      style: saved.style || 'icono',
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
  const { saveCheckoutState } = useCheckoutState()
  const { currencyCode } = useSettings()
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const saved = loadFromStorage()

  const [state, setState] = useState<ConfiguratorState>({
    step: 1,
    style: 'icono',
    petCount: 1,
    pets: [{ ...DEFAULT_PET }, { ...DEFAULT_PET }, { ...DEFAULT_PET }],
    phrase: '',
    phrase2: '',
    finalPreviewDataUrl: null,
    isGenerating: false,
    error: null,
    ...(saved ? { ...saved, style: 'icono' as const } : {}),
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

  const handleClearPet = useCallback((index: number) => {
    setState(prev => {
      const pets = [...prev.pets]
      pets[index] = { ...DEFAULT_PET }
      const newState = { ...prev, pets }
      // Write to localStorage synchronously — don't wait for useEffect
      saveToStorage(newState)
      return newState
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
        (status) => updatePet({ progressMessage: status })
      )

      updatePet({ generatedArtUrl: artUrl, isGeneratingArt: false })
      trackCustomEvent('icon_generated', {
        pet_index: petIndex,
        style: styleRef.current,
        pet_name: pet.name || 'sin_nombre',
      })
    } catch (err) {
      console.error('Error generating art:', err)
      updatePet({ isProcessingBg: false, isGeneratingArt: false })
      setState(s => ({
        ...s,
        error: err instanceof Error ? err.message : 'Error al generar el arte. Intenta de nuevo.',
      }))
    }
  }, [state.pets])

  // ─── Shared helper: build customization_data JSON and save to localStorage ──
  const saveCustomizationToCart = useCallback((currentState: ConfiguratorState, variantId: string, productId: string) => {
    const itemKey = `${productId}:${variantId}` // matches CartContext key format

    const customizationData = {
      type: 'patapete',
      style: currentState.style,
      pet_count: currentState.petCount,
      pets: currentState.pets.slice(0, currentState.petCount).map((p, i) => ({
        name: p.name || `Mascota ${i + 1}`,
        art_url: p.generatedArtUrl || null,
      })),
      phrase_top: currentState.phrase,
      phrase_bottom: currentState.phrase2,
      font: 'Plus Jakarta Sans 800',
      rug_size: '60x40cm',
      material: 'fibra sintetica sublimacion',
    }

    // Store immediately with the preview dataUrl for instant display in the cart
    const entry = {
      preview_dataurl: finalPreviewRef.current || null,
      preview_image_url: null as string | null,  // filled after async upload
      customization_data: customizationData,
    }
    try {
      localStorage.setItem(`patapete_customization:${itemKey}`, JSON.stringify(entry))
    } catch { /* localStorage may be full */ }

    // Upload the canvas preview to Supabase Storage in the background (non-blocking)
    if (finalPreviewRef.current) {
      const base64 = finalPreviewRef.current.split(',')[1] // strip "data:image/png;base64,"
      userSupabase.functions.invoke('upload-patapete-preview', { body: { base64 } })
        .then(({ data }) => {
          if (data?.url) {
            try {
              const existing = JSON.parse(localStorage.getItem(`patapete_customization:${itemKey}`) || '{}')
              existing.preview_image_url = data.url
              localStorage.setItem(`patapete_customization:${itemKey}`, JSON.stringify(existing))
            } catch { /* ignore */ }
          }
        })
        .catch((err) => console.warn('[Patapete] Background preview upload failed:', err))
    }

    return itemKey
  }, [])

  const handleAddToCart = useCallback(() => {
    if (!product) return
    const currentState = state
    const variantId = VARIANT_IDS[currentState.petCount]
    const variant = product?.variants?.find((v: any) => v.id === variantId)

    saveCustomizationToCart(currentState, variantId, product.id)
    addItem(product, variant)
    trackCustomEvent('configurator_add_to_cart', {
      pet_count: currentState.petCount,
      style: currentState.style,
      has_phrase: !!currentState.phrase,
      variant_id: variantId,
    })
    openCart()
  }, [product, state, addItem, openCart, saveCustomizationToCart])

  const handleOrderNow = useCallback(async () => {
    if (!product) return
    const currentState = state
    const variantId = VARIANT_IDS[currentState.petCount]
    const variant = product?.variants?.find((v: any) => v.id === variantId)
    const price = variant?.price ?? product.price ?? 0

    // 1. Guardar customización en localStorage (lo necesita cartToApiItems internamente)
    const itemKey = saveCustomizationToCart(currentState, variantId, product.id)

    // 2. Track AddToCart — opción B: ambos eventos para funnel completo
    trackAddToCart({
      products: [{ id: product.id, name: product.title || product.name, price, variant_id: variantId }],
      value: price,
      currency: currencyCode,
      num_items: 1,
    })

    // 3. Track evento custom Patapete
    trackCustomEvent('configurator_order_now', {
      pet_count: currentState.petCount,
      style: currentState.style,
      has_phrase: !!currentState.phrase,
      variant_id: variantId,
    })

    // 4. Crear orden en el backend directamente (sin pasar por CartContext, que aún no se actualizó)
    setIsCreatingOrder(true)
    try {
      // Construir CartItem manualmente — cartToApiItems leerá la customización de localStorage
      const cartItem: CartProductItem = {
        type: 'product',
        key: itemKey,
        product,
        variant,
        quantity: 1,
      }

      const order = await createCheckoutFromCart(
        [cartItem],
        undefined, undefined, undefined, undefined, undefined,
        currencyCode
      )

      console.log('[Patapete] checkout-create response:', {
        order_id: order.order_id,
        has_order: !!order.order,
        order_items_count: order.order?.order_items?.length ?? 'missing',
      })

      // Ensure order_items are in cache before navigating.
      // checkout-create may return order.order without order_items (empty or missing).
      // We call checkout-update with include_product_details to guarantee items are present
      // (same pattern used by cart flow: address update triggers checkout-update which populates items).
      let orderData = order.order ?? null
      if (!orderData?.order_items?.length) {
        console.log('[Patapete] order_items missing/empty — fetching via checkout-update...')
        try {
          const updateResponse = await updateCheckout({
            order_id: order.order_id,
            checkout_token: order.checkout_token,
            include_product_details: true,
          })
          if (updateResponse?.order?.order_items?.length) {
            orderData = updateResponse.order
            console.log('[Patapete] Got order_items via update:', orderData.order_items.length)
          } else {
            console.warn('[Patapete] checkout-update also returned no order_items')
          }
        } catch (updateErr) {
          console.warn('[Patapete] checkout-update failed:', updateErr)
        }
      }

      // Guardar estado de checkout — con order_items garantizados
      saveCheckoutState({
        order_id: order.order_id,
        checkout_token: order.checkout_token,
        store_id: STORE_ID,
        order: orderData ?? undefined,
      })

      // Mirror what CartAdapter does: also persist to sessionStorage
      try {
        sessionStorage.setItem('checkout_order', JSON.stringify(order))
        sessionStorage.setItem('checkout_order_id', String(order.order_id))
      } catch { /* ignore */ }

      // 5. Track InitiateCheckout — con total real del backend
      trackInitiateCheckout({
        products: [{ id: product.id, name: product.title || product.name, price, variant_id: variantId }],
        value: order.total_amount ?? price,
        currency: currencyCode,
        num_items: 1,
      })

      navigate('/pagar')
    } catch (error) {
      // Do NOT silently navigate — show error so user can retry
      console.error('[Patapete] Error creando checkout desde configurador:', error)
      setState(s => ({
        ...s,
        error: 'No se pudo iniciar el pedido. Inténtalo de nuevo.',
      }))
    } finally {
      setIsCreatingOrder(false)
    }
  }, [product, state, navigate, saveCustomizationToCart, saveCheckoutState, currencyCode])

  // ─── Auto-retry: si hay foto sin ícono al montar (reload / cambio de app) ────
  // Escenario: user sube foto → IA empieza a generar → sale de la app / recarga
  // → la conexión HTTP se corta → al volver, detectamos foto sin ícono y
  //   arrancamos sola la generación sin que el usuario haga nada.
  const autoRetryDoneRef = useRef(false)

  useEffect(() => {
    if (autoRetryDoneRef.current) return
    autoRetryDoneRef.current = true

    state.pets.forEach((pet, i) => {
      // Solo mascotas activas con foto pero sin ícono y que no estén procesando
      if (
        i < state.petCount &&
        pet.photoBase64 &&
        !pet.generatedArtUrl &&
        !pet.isProcessingBg &&
        !pet.isGeneratingArt
      ) {
        console.log(`[Patapete] Auto-retry generación para mascota ${i + 1}`)
        handleGenerate(i)
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps — corre solo una vez al montar

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
          onClearPet={handleClearPet}
          onAddToCart={handleAddToCart}
          onOrderNow={handleOrderNow}
          onPreviewReady={handlePreviewReady}
          isCreatingOrder={isCreatingOrder}
        />
      )}
    </div>
  )
}