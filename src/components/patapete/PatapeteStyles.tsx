import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const styles = [
  {
    id: 'tattoo',
    image: '/style-tattoo.jpg',
    name: 'Tatuaje IA',
    badge: '⭐ Más vendido',
    badgeClass: 'bg-primary text-primary-foreground',
    desc: 'Sube la foto de tu mascota y la IA la convierte en un retrato estilo tatuaje fino con trazos botánicos. El resultado más sofisticado y llamativo.',
    featured: true,
  },
  {
    id: 'vector',
    image: '/style-vector.jpg',
    name: 'Vector',
    badge: '🎨 Moderno',
    badgeClass: 'bg-accent text-accent-foreground',
    desc: 'Tu foto se transforma en arte vectorial plano con colores vivos y trazos limpios. Estilo sticker ilustrado, moderno y contrastante.',
    featured: false,
  },
]

export const PatapeteStyles = () => {
  return (
    <section id="estilos" className="section-padding texture-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">
            Estilos disponibles
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Elige el arte de tu tapete
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Dos estilos únicos, ambos con el retrato de tu mascota sobre fibra de coco natural.
          </p>
        </div>

        {/* Cards — centered 2-column */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 max-w-3xl mx-auto">
          {styles.map((style) => (
            <div
              key={style.id}
              className={`card-premium overflow-hidden flex flex-col ${
                style.featured
                  ? 'ring-2 ring-primary/40 shadow-warm-lg md:scale-[1.02]'
                  : ''
              }`}
            >
              {/* Image */}
              <div className="relative overflow-hidden">
                <div className="aspect-square bg-muted">
                  <img
                    src={style.image}
                    alt={`Tapete Patapete estilo ${style.name}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${style.badgeClass}`}>
                  {style.badge}
                </span>
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-1">
                <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                  {style.name}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-5 flex-1">
                  {style.desc}
                </p>
                <Button
                  asChild
                  variant={style.featured ? 'default' : 'outline'}
                  className={`w-full rounded-xl font-semibold ${
                    style.featured ? 'shadow-primary' : ''
                  }`}
                >
                  <Link to="/productos/tapete-personalizado-patapete">
                    Diseñar con este estilo <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}