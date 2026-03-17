import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PHOTOS = [
  {
    url: 'https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773768438251-79davb2huk.webp',
    alt: 'Rocco el pastor alemán junto a su tapete personalizado en la cocina',
    caption: '"Pregunta por Rocco antes de entrar"',
    pet: 'Rocco · Pastor Alemán',
  },
  {
    url: 'https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773768438251-kqrq9bnc2q7.webp',
    alt: 'Tapete personalizado con tres perros: Rocco, Buddy y Coco',
    caption: '"Toca timbre, luego corre"',
    pet: 'Rocco, Buddy & Coco',
  },
  {
    url: 'https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773768438251-xrdo9mrysk.webp',
    alt: 'Salem el gato negro junto a su tapete personalizado en el pasillo',
    caption: '"Prepara tu soborno en atún"',
    pet: 'Salem · Gato Negro',
  },
  {
    url: 'https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773768438251-il55q3miib.webp',
    alt: 'Tapete de Buddy el Golden Retriever recién desempacado',
    caption: '"¡Cuidado con el besucón!"',
    pet: 'Buddy · Golden Retriever',
  },
  {
    url: 'https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773768438251-b6cszct9tu8.webp',
    alt: 'Tapete personalizado de Milo el dachshund sobre piso de madera',
    caption: '"No tocar... mis juguetes"',
    pet: 'Milo · Dachshund',
  },
]

export const PatapeteUGCGallery = () => {
  return (
    <section
      aria-label="Fotos reales de clientes"
      className="section-padding bg-background"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">
            Fotos reales · Sin filtros
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-3">
            Así llegó a sus hogares
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Clientes reales, mascotas reales. Estas fotos las tomaron ellos — no nosotros.
          </p>
        </div>

        {/* Photo grid — 2 top + 3 bottom */}
        <div className="space-y-3">
          {/* Row 1: 2 photos */}
          <div className="grid grid-cols-2 gap-3">
            {PHOTOS.slice(0, 2).map((photo) => (
              <PhotoCard key={photo.pet} photo={photo} tall />
            ))}
          </div>

          {/* Row 2: 3 photos */}
          <div className="grid grid-cols-3 gap-3">
            {PHOTOS.slice(2, 5).map((photo) => (
              <PhotoCard key={photo.pet} photo={photo} />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Button asChild size="lg" className="rounded-2xl px-8 shadow-primary">
            <Link to="/productos/tapete-personalizado-patapete">
              Crear el mío
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-3">
            Tu mascota merece su lugar en la entrada 🐾
          </p>
        </div>
      </div>
    </section>
  )
}

// ─── PhotoCard subcomponent ─────────────────────────────────────────────────
function PhotoCard({
  photo,
  tall = false,
}: {
  photo: (typeof PHOTOS)[0]
  tall?: boolean
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-muted ${
        tall ? 'h-72 sm:h-96 md:h-[440px]' : 'h-52 sm:h-72 md:h-80'
      }`}
    >
      <img
        src={photo.url}
        alt={photo.alt}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Gradient overlay — always visible on mobile, hover on desktop */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300" />

      {/* Caption */}
      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-0 md:translate-y-2 md:group-hover:translate-y-0 transition-transform duration-300">
        <p className="text-white font-bold text-sm leading-snug mb-1 drop-shadow-sm">
          {photo.caption}
        </p>
        <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full border border-white/30">
          🐾 {photo.pet}
        </span>
      </div>
    </div>
  )
}