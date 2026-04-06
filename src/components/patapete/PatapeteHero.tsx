import { Link } from 'react-router-dom'
import { ArrowDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const PatapeteHero = () => {
  const trustItems = [
    'Hecho a pedido en México',
    'Ve el resultado antes de pagar',
    '1 a 3 mascotas por tapete',
  ]

  return (
    <section id="hero" className="relative flex items-center" style={{ minHeight: '100svh' }}>
      {/* Background image */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src="/hero.webp"
          alt="Tapete personalizado Patapete con retrato de mascota en entrada de casa"
          className="w-full h-full object-cover object-center md:object-center"
          style={{ objectPosition: 'center 30%' }}
          fetchPriority="high"
          decoding="sync"
          width={1920}
          height={1280}
        />
        <div className="hero-overlay absolute inset-0" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-20 pb-14 md:py-32">
        <div className="max-w-2xl animate-fade-up">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-1.5 bg-white/15 border border-white/25 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs md:text-sm font-medium text-white mb-4 md:mb-7">
            🐾 <span>Tapetes personalizados · Hecho en México</span>
          </div>

          {/* Main headline */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-bold text-white leading-[1.1] mb-4 md:mb-6">
            Convierte a tu mascota{' '}
            <em className="not-italic" style={{ color: 'hsl(38 60% 75%)' }}>en arte</em>
            {' '}para la entrada de tu casa.
          </h1>

          {/* Subheadline */}
          <p
            className="text-base md:text-2xl text-white mb-5 md:mb-9 max-w-xl leading-relaxed font-light"
            style={{ textShadow: '0 1px 6px rgba(0,0,0,0.55)' }}
          >
            Sube su foto. Ve cómo queda en tu tapete <strong className="font-semibold">antes de comprarlo</strong> — hecho especialmente para ti.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-2.5 md:gap-3 mb-3 md:mb-4">
            <Button
              asChild
              size="lg"
              className="font-semibold px-8 py-5 md:py-6 rounded-xl text-base shadow-primary-lg hover:-translate-y-0.5 transition-all duration-200 hover:shadow-xl"
            >
              <Link to="/productos/tapete-personalizado-patapete">
                Diseña tu tapete →
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="font-semibold px-8 py-5 md:py-6 rounded-xl text-base border-2 border-white/50 bg-white/10 text-white hover:bg-white/20 hover:text-white hover:border-white/70 backdrop-blur-sm"
              style={{ background: 'rgba(255,255,255,0.10)' }}
            >
              <a href="#como-funciona">
                ¿Cómo funciona?
              </a>
            </Button>
          </div>

          {/* Price anchor */}
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-5 md:mb-9">
            <span
              className="text-white font-bold text-base md:text-lg"
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
            >
              Desde $949 MXN
            </span>
            <span
              className="text-white/55 line-through text-sm md:text-base font-medium"
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
            >
              $1,199
            </span>
            <span
              className="text-white/70 text-xs md:text-sm"
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
            >
              · Envío incluido
            </span>
          </div>

          {/* Trust microcopy */}
          <div className="flex flex-wrap gap-2">
            {trustItems.map((text) => (
              <span
                key={text}
                className="inline-flex items-center gap-1.5 text-[11px] md:text-xs font-medium px-2.5 py-1 md:px-3 md:py-1.5 rounded-full bg-white/12 text-white border border-white/20 backdrop-blur-sm"
              >
                <Check className="h-3 w-3 text-white/75 shrink-0" />
                {text}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator — hidden on mobile to save space */}
      <a
        href="#confianza"
        className="hidden md:block absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 hover:text-white/80 transition-colors animate-float"
        aria-label="Scroll hacia abajo"
      >
        <ArrowDown className="h-6 w-6" />
      </a>
    </section>
  )
}