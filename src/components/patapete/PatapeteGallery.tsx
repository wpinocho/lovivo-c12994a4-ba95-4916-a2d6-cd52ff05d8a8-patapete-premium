import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const items = [
  {
    img: 'https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773708041415-a5fq7lvhm76.webp',
    label: 'Luna, Max & Cleo',
    pets: '3 mascotas',
    phrase: '¡Cuidado con los pelos!',
  },
  {
    img: 'https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773708041415-gvrnbkq9sha.webp',
    label: 'Gordo',
    pets: '1 mascota',
    phrase: 'El tapete es más bravo que él',
  },
  {
    img: 'https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773708041415-j77t1fh1gi.webp',
    label: 'Michi',
    pets: '1 mascota',
    phrase: 'Los humanos solo pagan la renta',
  },
  {
    img: 'https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773708041415-zjk86pot9e.webp',
    label: 'Rex & Lulú',
    pets: '2 mascotas',
    phrase: 'Permiso de entrada: una golosina',
  },
]

export const PatapeteGallery = () => {
  return (
    <section id="galeria" className="section-padding bg-muted/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">
            Galería de tapetes
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Así quedan los tapetes reales
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Cada uno hecho especialmente para cada mascota. El tuyo también puede verse así.
          </p>
        </div>

        {/* Gallery grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {items.map((item, i) => (
            <Link
              key={item.label}
              to="/productos/tapete-personalizado-patapete"
              className="group relative overflow-hidden rounded-2xl bg-card border border-border/50 shadow-warm hover:shadow-warm-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={item.img}
                  alt={`Tapete Patapete - ${item.label}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading={i < 2 ? 'eager' : 'lazy'}
                  decoding="async"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-xs font-semibold text-white">{item.label}</p>
                <p className="text-xs text-white/70">{item.pets}</p>
              </div>
              {/* Static label */}
              <div className="p-3">
                <p className="text-xs font-semibold text-foreground truncate">{item.label}</p>
                <p className="text-xs text-muted-foreground truncate italic">&ldquo;{item.phrase}&rdquo;</p>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button asChild size="lg" className="rounded-xl font-semibold px-8 shadow-primary hover:-translate-y-0.5 transition-all duration-200">
            <Link to="/productos/tapete-personalizado-patapete">
              Diseña el tuyo ahora
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}