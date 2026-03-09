import { EcommerceTemplate } from '@/templates/EcommerceTemplate'
import { PatapeteHero } from '@/components/patapete/PatapeteHero'
import { PatapeteTrustStrip } from '@/components/patapete/PatapeteTrustStrip'
import { PatapeteHowItWorks } from '@/components/patapete/PatapeteHowItWorks'
import { PatapeteStyles } from '@/components/patapete/PatapeteStyles'
import { PatapeteTransformation } from '@/components/patapete/PatapeteTransformation'
import { PatapeteGallery } from '@/components/patapete/PatapeteGallery'
import { PatapeteBenefits } from '@/components/patapete/PatapeteBenefits'
import { PatapetePersonalization } from '@/components/patapete/PatapetePersonalization'
import { PatapeteMaterials } from '@/components/patapete/PatapeteMaterials'
import { PatapeteFAQ } from '@/components/patapete/PatapeteFAQ'
import { PatapeteFinalCTA } from '@/components/patapete/PatapeteFinalCTA'
import { PatapeteWhatsApp } from '@/components/patapete/PatapeteWhatsApp'
import type { UseIndexLogicReturn } from '@/components/headless/HeadlessIndex'

/**
 * EDITABLE UI - IndexUI
 * Homepage de Patapete — tapetes personalizados para mascotas.
 */

interface IndexUIProps {
  logic: UseIndexLogicReturn
}

export const IndexUI = ({ logic: _logic }: IndexUIProps) => {
  return (
    <EcommerceTemplate showCart={true} layout="full-width">
      {/* 1. Hero principal */}
      <PatapeteHero />

      {/* 2. Barra de confianza */}
      <PatapeteTrustStrip />

      {/* 3. Cómo funciona */}
      <PatapeteHowItWorks />

      {/* 4. Los 3 estilos */}
      <PatapeteStyles />

      {/* 5. Transformación / Before-After */}
      <PatapeteTransformation />

      {/* 6. Galería de tapetes reales */}
      <PatapeteGallery />

      {/* 7. Beneficios / Por qué Patapete */}
      <PatapeteBenefits />

      {/* 8. Personalización */}
      <PatapetePersonalization />

      {/* 9. Materiales y detalles del producto */}
      <PatapeteMaterials />

      {/* 10. FAQ */}
      <PatapeteFAQ />

      {/* 11. CTA final */}
      <PatapeteFinalCTA />

      {/* WhatsApp flotante */}
      <PatapeteWhatsApp />
    </EcommerceTemplate>
  )
}