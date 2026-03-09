import { Link } from 'react-router-dom'
import { ArrowDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const PatapeteHero = () => {
  const trustItems = [
    'Hecho a pedido en México',
    'Preview antes de comprar',
    '1 a 3 mascotas por tapete',
  ]

  return (
    <section id="hero" className="relative min-h-[90vh] flex items-center">
      {/* Background image */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src="/hero-patapete.jpg"
          alt="Tapete personalizado Patapete con retrato de mascota en entrada de casa"
          className="w-full h-full object-cover"
          fetchPriority="high"
          decoding="sync"
        />
        <div className="hero-overlay absolute inset-0" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-24 md:py-32">
        <div className="max-w-2xl animate-fade-up">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium text-white mb-7">
            🐾 <span>Tapetes personalizados · Hecho en México</span>
          </div>

          {/* Main headline */}
          <h1 className="font-display text-5xl md:text-6xl lg:text-[4.25rem] font-bold text-white leading-[1.1] mb-6">
            Convierte a tu mascota{' '}
            <em className="not-italic" style={{ color: 'hsl(38 60% 75%)' }}>en arte</em>
            {' '}para la entrada de tu casa.
          </h1>

          {/* Subheadline */}
          <p
            className="text-xl md:text-2xl text-white mb-9 max-w-xl leading-relaxed font-light"
            style={{ textShadow: '0 1px 6px rgba(0,0,0,0.55)' }}
          >
            Sube su foto, elige el estilo y mira cómo queda tu tapete antes de comprarlo.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 mb-9">
            <Button
              asChild
              size="lg"
              className="font-semibold px-8 py-6 rounded-xl text-base shadow-primary-lg hover:-translate-y-0.5 transition-all duration-200 hover:shadow-xl"
            >
              <Link to="/productos/tapete-personalizado-patapete">
                Diseña tu tapete →
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="font-semibold px-8 py-6 rounded-xl text-base border-2 border-white/50 bg-white/10 text-white hover:bg-white/20 hover:text-white hover:border-white/70 backdrop-blur-sm"
              style={{ background: 'rgba(255,255,255,0.10)' }}
            >
              <a href="#estilos">
                Ver estilos
              </a>
            </Button>
          </div>

          {/* Trust microcopy */}
          <div className="flex flex-wrap gap-2.5">
            {trustItems.map((text) => (
              <span
                key={text}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-background/85 text-foreground border border-border/50 backdrop-blur-sm"
              >
                <Check className="h-3 w-3 text-primary shrink-0" />
                {text}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <a
        href="#confianza"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 hover:text-white/80 transition-colors animate-float"
        aria-label="Scroll hacia abajo"
      >
        <ArrowDown className="h-6 w-6" />
      </a>
    </section>
  )
}