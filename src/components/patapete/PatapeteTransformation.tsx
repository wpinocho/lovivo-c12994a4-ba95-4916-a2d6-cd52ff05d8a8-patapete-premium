import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const PatapeteTransformation = () => {
  return (
    <section className="section-padding bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text side */}
          <div className="order-2 lg:order-1">
            <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">
              La magia del producto
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-5 leading-tight">
              De la foto de tu mascota a una obra de arte en tu entrada.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Nuestro sistema transforma la foto de tu mascota en un retrato artístico único. Luego lo imprimimos por sublimación directamente en la fibra — el resultado dura años.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed mb-8">
              El resultado es un tapete que se ve como si un ilustrador lo hubiera hecho especialmente para ti — porque básicamente así fue.
            </p>

            {/* Step indicators */}
            <div className="flex items-center gap-4 mb-8">
              {[
                { label: 'Tu foto', color: 'bg-muted' },
                { label: 'Retrato único', color: 'bg-primary/15' },
                { label: 'Tu tapete', color: 'bg-primary/25' },
              ].map((item, i) => (
                <div key={item.label} className="flex items-center gap-4">
                  <div className={`px-4 py-2 rounded-xl ${item.color} text-sm font-medium text-foreground`}>
                    {item.label}
                  </div>
                  {i < 2 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </div>
              ))}
            </div>

            <Button asChild size="lg" className="rounded-xl font-semibold px-8 shadow-primary hover:-translate-y-0.5 transition-all duration-200">
              <Link to="/productos/tapete-personalizado-patapete">
                Ver cómo queda el mío
              </Link>
            </Button>
          </div>

          {/* Image side */}
          <div className="order-1 lg:order-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl transform rotate-2" />
              <div className="relative bg-card rounded-3xl overflow-hidden shadow-warm-lg border border-border/40 p-4">
                <img
                  src="https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773707761228-8i08cxe955s.webp"
                  alt="Canela junto a su tapete personalizado Patapete — retrato de mascota impreso por sublimación"
                  className="w-full rounded-2xl object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="flex justify-between mt-4 px-2">
                  {['Tu foto', 'Retrato único', 'Tu tapete'].map((label) => (
                    <div key={label} className="text-center">
                      <span className="text-xs font-medium text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}