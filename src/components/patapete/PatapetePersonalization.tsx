import { Link } from 'react-router-dom'
import { Camera, Palette, Type, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const features = [
  {
    icon: Camera,
    title: 'Hasta 3 mascotas por tapete',
    desc: 'Sube una foto por cada mascota. Las combinamos en un solo diseño armonioso.',
  },
  {
    icon: Palette,
    title: 'Elige el estilo de arte',
    desc: 'Tatuaje IA o Vector. Cada uno con una personalidad distinta y única.',
  },
  {
    icon: Type,
    title: 'Agrega nombre o frase',
    desc: 'El nombre de tu mascota o una frase corta que le dé ese toque especial.',
  },
]

const phrases = [
  'Bienvenidos a casa',
  'Home is where the paws are',
  'Cuidado: aquí manda el perro',
  'Aquí vivimos bajo aprobación perruna',
  'The dog\'s house',
]

export const PatapetePersonalization = () => {
  return (
    <section className="section-padding texture-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left: Features */}
          <div>
            <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">
              Personalización
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-5 leading-tight">
              Tú decides cómo queda.
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              El diseño es completamente tuyo. Mascotas, estilo y mensaje — todo lo eliges tú antes de confirmar.
            </p>

            <div className="space-y-6">
              {features.map(function(feat) {
                const Icon = feat.icon
                return (
                  <div key={feat.title} className="flex gap-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{feat.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-10">
              <Button asChild size="lg" className="rounded-xl font-semibold px-8 shadow-primary hover:-translate-y-0.5 transition-all duration-200">
                <Link to="/productos/tapete-personalizado-patapete">
                  Diseñar mi tapete <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Right: Phrase examples */}
          <div>
            <div className="bg-card rounded-3xl border border-border/60 shadow-warm p-8">
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                Ejemplos de frases
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                O escribe la tuya propia — mientras sea corta, queda perfecta.
              </p>

              <div className="flex flex-wrap gap-2.5">
                {phrases.map(function(phrase) {
                  return (
                    <span
                      key={phrase}
                      className="px-4 py-2 rounded-full bg-secondary border border-border/60 text-sm text-foreground font-medium hover:bg-primary/10 hover:border-primary/30 transition-colors cursor-pointer"
                    >
                      &ldquo;{phrase}&rdquo;
                    </span>
                  )
                })}
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex -space-x-2">
                    {['/style-tattoo.jpg', '/style-vector.jpg'].map(function(src, i) {
                      return (
                        <div key={i} className="w-9 h-9 rounded-full overflow-hidden border-2 border-background bg-muted">
                          <img src={src} alt="" className="w-full h-full object-cover" aria-hidden="true" />
                        </div>
                      )
                    })}
                  </div>
                  <p>
                    <strong className="text-foreground">+500 tapetes</strong> diseñados por dueños como tú
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}