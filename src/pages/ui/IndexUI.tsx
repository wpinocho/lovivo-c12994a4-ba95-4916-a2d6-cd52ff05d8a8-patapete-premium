import { lazy, Suspense } from 'react'
import { EcommerceTemplate } from '@/templates/EcommerceTemplate'

// Above-fold: always sync (crítico para FCP)
import { PatapeteHero } from '@/components/patapete/PatapeteHero'
import { PatapeteTrustStrip } from '@/components/patapete/PatapeteTrustStrip'
import { PatapeteHowItWorks } from '@/components/patapete/PatapeteHowItWorks'
import { PatapeteWhatsApp } from '@/components/patapete/PatapeteWhatsApp'

// Below-fold: lazy loaded (reducen JS inicial)
const PatapeteTestimonials   = lazy(() => import('@/components/patapete/PatapeteTestimonials').then(m => ({ default: m.PatapeteTestimonials })))
const PatapeteTransformation = lazy(() => import('@/components/patapete/PatapeteTransformation').then(m => ({ default: m.PatapeteTransformation })))
const PatapeteGallery        = lazy(() => import('@/components/patapete/PatapeteGallery').then(m => ({ default: m.PatapeteGallery })))
const PatapeteBenefits       = lazy(() => import('@/components/patapete/PatapeteBenefits').then(m => ({ default: m.PatapeteBenefits })))
const PatapeteGiftSection    = lazy(() => import('@/components/patapete/PatapeteGiftSection').then(m => ({ default: m.PatapeteGiftSection })))
const PatapetePersonalization = lazy(() => import('@/components/patapete/PatapetePersonalization').then(m => ({ default: m.PatapetePersonalization })))
const PatapeteMaterials      = lazy(() => import('@/components/patapete/PatapeteMaterials').then(m => ({ default: m.PatapeteMaterials })))
const PatapeteFAQ            = lazy(() => import('@/components/patapete/PatapeteFAQ').then(m => ({ default: m.PatapeteFAQ })))
const PatapeteFinalCTA       = lazy(() => import('@/components/patapete/PatapeteFinalCTA').then(m => ({ default: m.PatapeteFinalCTA })))

import type { UseIndexLogicReturn } from '@/components/headless/HeadlessIndex'

/**
 * EDITABLE UI - IndexUI
 * Homepage de Patapete — tapetes personalizados para mascotas.
 * 
 * Above-fold: sync (Hero, TrustStrip, HowItWorks)
 * Below-fold: lazy loaded para reducir JS inicial y mejorar FCP/TBT
 */

interface IndexUIProps {
  logic: UseIndexLogicReturn
}

// Skeleton placeholder genérico para secciones below-fold
const SectionSkeleton = () => (
  <div className="section-padding">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="h-64 bg-muted/30 animate-pulse rounded-2xl" />
    </div>
  </div>
)

export const IndexUI = ({ logic: _logic }: IndexUIProps) => {
  return (
    <EcommerceTemplate showCart={true} layout="full-width" transparentOnTop={true}>
      {/* ── ABOVE FOLD (sync) ───────────────────────────────── */}
      {/* 1. Hero principal */}
      <PatapeteHero />

      {/* 2. Barra de confianza */}
      <PatapeteTrustStrip />

      {/* 3. Cómo funciona */}
      <PatapeteHowItWorks />

      {/* ── BELOW FOLD (lazy) ──────────────────────────────── */}
      {/* 4. Testimonios de clientes */}
      <Suspense fallback={<SectionSkeleton />}>
        <PatapeteTestimonials />
      </Suspense>

      {/* 5. Transformación / Before-After */}
      <Suspense fallback={<SectionSkeleton />}>
        <PatapeteTransformation />
      </Suspense>

      {/* 6. Galería de tapetes reales */}
      <Suspense fallback={<SectionSkeleton />}>
        <PatapeteGallery />
      </Suspense>

      {/* 7. Beneficios / Por qué Patapete */}
      <Suspense fallback={<SectionSkeleton />}>
        <PatapeteBenefits />
      </Suspense>

      {/* 8. Sección de regalo */}
      <Suspense fallback={<SectionSkeleton />}>
        <PatapeteGiftSection />
      </Suspense>

      {/* 9. Personalización */}
      <Suspense fallback={<SectionSkeleton />}>
        <PatapetePersonalization />
      </Suspense>

      {/* 10. Materiales y detalles del producto */}
      <Suspense fallback={<SectionSkeleton />}>
        <PatapeteMaterials />
      </Suspense>

      {/* 11. FAQ */}
      <Suspense fallback={<SectionSkeleton />}>
        <PatapeteFAQ />
      </Suspense>

      {/* 12. CTA final */}
      <Suspense fallback={<SectionSkeleton />}>
        <PatapeteFinalCTA />
      </Suspense>

      {/* WhatsApp flotante — siempre presente */}
      <PatapeteWhatsApp />
    </EcommerceTemplate>
  )
}