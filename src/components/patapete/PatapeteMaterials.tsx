import { Link } from 'react-router-dom'
import { Zap, Ruler, Clock, Shield, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const specs = [
  { icon: Zap,    label: 'Impresión', value: 'Sublimación HD — fusionada en la fibra' },
  { icon: Ruler,  label: 'Medidas',   value: '60 × 40 cm · Base antideslizante' },
  { icon: Shield, label: 'Garantía',  value: 'Por daño o defecto de producción' },
  { icon: Clock,  label: 'Entrega',   value: '5 a 10 días hábiles' },
]

export const PatapeteMaterials = () => {
  return (
    <section className="section-padding bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image side */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-primary/8 to-accent/8 rounded-3xl -z-10" />
            <div className="rounded-3xl overflow-hidden shadow-warm-lg border border-border/30">
              <img
                src="/material-coco.jpg"
                alt="Textura del tapete Patapete con impresión de alta definición"
                className="w-full h-72 md:h-96 object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-4 -right-4 bg-card rounded-2xl border border-border/60 shadow-warm p-4 text-center">
              <p className="font-display text-2xl font-bold text-foreground">HD</p>
              <p className="text-xs text-muted-foreground mt-0.5">Sublimación</p>
            </div>
          </div>

          {/* Text side */}
          <div>
            <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">
              El producto
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-5 leading-tight">
              El arte de tu mascota, fusionado en cada fibra.
            </h2>
            <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
              La imagen no está pintada por encima — está sublimada directamente en el material. Písalo todo lo que quieras: no se pela, no se agrieta, no pierde color con el uso diario.
            </p>
            <p className="text-base text-muted-foreground mb-8 leading-relaxed">
              La base es fibra sintética con la misma textura y carácter de la coco tradicional. Se ve premium, limpia los zapatos y aguanta lluvia, lodo y manguerazos sin pudrirse.
            </p>

            {/* Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {specs.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-3 p-4 rounded-xl bg-muted/60 border border-border/40">
                  <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-foreground leading-snug">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button asChild size="lg" className="rounded-xl font-semibold px-8 shadow-primary hover:-translate-y-0.5 transition-all duration-200">
              <Link to="/productos/tapete-personalizado-patapete">
                Diseñar el mío <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}