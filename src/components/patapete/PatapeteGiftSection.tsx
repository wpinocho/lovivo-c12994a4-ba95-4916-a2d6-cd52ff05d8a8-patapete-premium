import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const occasions = [
  {
    emoji: '🌸',
    title: 'Día de las Madres',
    desc: 'El regalo más personal que le puedes dar a alguien que ama a su mascota como a un hijo.',
  },
  {
    emoji: '🎄',
    title: 'Navidad',
    desc: 'Llega a tiempo para las fiestas. Solo sube la foto y nosotros hacemos el resto.',
  },
  {
    emoji: '🎂',
    title: 'Cumpleaños',
    desc: 'Para alguien que ya tiene todo — excepto un tapete con la carita de su perro.',
  },
  {
    emoji: '💝',
    title: 'Sin ocasión',
    desc: 'Porque a veces el mejor regalo es el que no se espera para ninguna fecha especial.',
  },
]

export const PatapeteGiftSection = () => {
  return (
    <section className="section-padding bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">

          {/* Left — copy */}
          <div>
            <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">
              El regalo perfecto
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-5 leading-tight">
              El regalo que no olvidarán.
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-md">
              Un tapete personalizado es el único regalo que combina arte, humor y amor por las mascotas — todo en uno. Se empaca perfecto para regalar.
            </p>

            <Button asChild size="lg" className="rounded-xl font-semibold px-8">
              <Link to="/productos/tapete-personalizado-patapete">
                Regala uno ahora →
              </Link>
            </Button>
          </div>

          {/* Right — occasion cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12 lg:mt-0">
            {occasions.map(({ emoji, title, desc }) => (
              <div
                key={title}
                className="group p-5 rounded-2xl border border-border/60 bg-card hover:border-primary/30 hover:shadow-warm transition-all duration-300"
              >
                <div className="text-3xl mb-3">{emoji}</div>
                <h3 className="font-semibold text-foreground mb-1.5 text-sm">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}