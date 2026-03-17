import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Scissors, Zap, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'

const features = [
  {
    icon: Scissors,
    title: 'Recorte cabeza y hombros',
    desc: 'La IA detecta automáticamente a tu mascota y hace un encuadre perfecto tipo retrato.',
  },
  {
    icon: Sparkles,
    title: 'Arte estilo tatuaje fino',
    desc: 'Trazos botánicos, líneas detalladas y una estética única impresa con sublimación HD — los colores están dentro de la fibra.',
  },
  {
    icon: Zap,
    title: 'Resultado en segundos',
    desc: 'Sube la foto y en menos de un minuto ves exactamente cómo quedará tu tapete.',
  },
  {
    icon: Heart,
    title: 'Arte exclusivo para ti',
    desc: 'Cada retrato es único. La IA nunca genera dos veces el mismo resultado.',
  },
]

export const PatapeteStyles = () => {
  return (
    <section id="estilos" className="section-padding texture-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">
            El arte IA
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Tu mascota convertida en retrato artístico
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Un modelo de IA entrenado especialmente para crear retratos de mascotas con el estilo
            de un tatuaje fino. El resultado habla solo.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="card-premium p-6 flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1.5 leading-snug">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4">
            <Button
              asChild
              size="lg"
              className="rounded-xl font-semibold px-8 shadow-primary hover:-translate-y-0.5 transition-all duration-200"
            >
              <Link to="/productos/tapete-personalizado-patapete">
                Prueba el generador gratis <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              Sin costo. Ves el resultado antes de pagar.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}