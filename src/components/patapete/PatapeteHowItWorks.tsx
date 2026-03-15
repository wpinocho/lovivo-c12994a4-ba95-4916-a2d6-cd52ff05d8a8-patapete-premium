import { Link } from 'react-router-dom'
import { Upload, Palette, Eye, Home, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Sube la foto de tu mascota',
    desc: 'Cualquier foto donde se vea bien su carita. Cuanto mejor la foto, mejor el resultado.',
  },
  {
    number: '02',
    icon: Palette,
    title: 'Tu mascota, convertida en arte',
    desc: 'En segundos verás su retrato artístico único, con trazos estilo tatuaje fino listos para plasmarse en tu tapete.',
  },
  {
    number: '03',
    icon: Eye,
    title: 'Ve cómo queda tu tapete',
    desc: 'Antes de pagar, verás exactamente cómo lucirá con el arte de tu mascota.',
  },
  {
    number: '04',
    icon: Home,
    title: 'Recíbelo en casa',
    desc: 'Lo producimos especialmente para ti y lo enviamos a cualquier parte de México.',
  },
]

export const PatapeteHowItWorks = () => {
  return (
    <section id="como-funciona" className="section-padding bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">
            Proceso
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Así de fácil es diseñar el tuyo
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Cuatro pasos sencillos. De tu foto al tapete en tu entrada.
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {steps.map(({ number, icon: Icon, title, desc }) => (
            <div key={number} className="relative group">
              {/* Connector line on desktop */}
              <div className="hidden lg:block absolute top-6 left-[calc(50%+28px)] w-full h-px bg-border -translate-y-1/2 z-0 last:hidden" />

              <div className="relative z-10 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors duration-200">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="font-display text-4xl font-bold text-border mb-2 leading-none">
                  {number}
                </div>
                <h3 className="font-semibold text-foreground mb-2 text-base leading-snug">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button asChild size="lg" className="rounded-xl font-semibold px-8 shadow-primary hover:-translate-y-0.5 transition-all duration-200">
            <Link to="/productos/tapete-personalizado-patapete">
              Empieza ahora <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}