import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const PatapeteFinalCTA = () => {
  return (
    <section className="relative py-24 md:py-36 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="/cta-patapete.jpg"
          alt="Tapete Patapete en entrada de casa con mascota feliz"
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className="hero-overlay absolute inset-0" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm font-semibold tracking-widest uppercase mb-5" style={{ color: 'hsl(38 60% 75%)' }}>
          🐾 El tapete que estabas buscando
        </p>
        <h2 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          Tu mascota merece un lugar en tu entrada.
        </h2>
        <p className="text-xl text-white/80 mb-10 max-w-xl mx-auto leading-relaxed font-light">
          Diseña tu tapete en minutos, ve cómo queda antes de comprarlo y recíbelo en casa.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            asChild
            size="lg"
            className="font-semibold px-10 py-7 rounded-xl text-lg shadow-primary-lg hover:-translate-y-1 transition-all duration-200 hover:shadow-xl"
          >
            <Link to="/productos/tapete-personalizado-patapete">
              Diseña el tuyo ahora <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>

        <p className="mt-6 text-sm text-white/55">
          Hecho a pedido en México · Preview antes de pagar · Envío a todo México
        </p>
      </div>
    </section>
  )
}