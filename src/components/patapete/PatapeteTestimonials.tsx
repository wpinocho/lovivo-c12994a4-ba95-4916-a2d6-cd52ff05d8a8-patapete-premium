import { Star } from 'lucide-react'

const testimonials = [
  {
    name: 'María G.',
    city: 'Ciudad de México',
    petName: 'Luna',
    petType: 'Golden Retriever · 4 años',
    rating: 5,
    text: 'Nunca imaginé que un tapete pudiera hacerme llorar de emoción. El de mi Luna quedó perfectamente igual a ella — la cara, la expresión, todo. Mis visitas siempre preguntan dónde lo compré.',
    avatarInitials: 'MG',
    photo: 'https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773768438251-il55q3miib.webp',
    photoAlt: 'Tapete personalizado de mascota en caja de envío',
  },
  {
    name: 'Rodrigo M.',
    city: 'Guadalajara',
    petName: 'Canelo',
    petType: 'Labrador · 6 años',
    rating: 5,
    text: 'Lo pedí como regalo para mi mamá y no pudo creer que fuera real. Dijo que era "el regalo más bonito que le habían dado". Canelo ya tiene su trono en la entrada de la casa.',
    avatarInitials: 'RM',
    photo: 'https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773768438251-79davb2huk.webp',
    photoAlt: 'Pastor alemán junto a su tapete personalizado en la cocina',
  },
  {
    name: 'Sofía V.',
    city: 'Monterrey',
    petName: 'Mochi, Nala y Churro',
    petType: '3 Frenchies',
    rating: 5,
    text: 'Tenemos tres perros así que pedí uno con los tres juntos. El resultado superó todas mis expectativas — la calidad del material y el nivel de detalle del diseño son increíbles. Ya quiero uno para el cuarto.',
    avatarInitials: 'SV',
    photo: 'https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773768438251-kqrq9bnc2q7.webp',
    photoAlt: 'Tapete personalizado con tres perros siendo sostenido',
  },
  {
    name: 'Carlos B.',
    city: 'Puebla',
    petName: 'Brody',
    petType: 'Dálmata · Siempre en el corazón',
    rating: 5,
    text: 'Mi perro falleció hace unos meses. Este tapete se convirtió en la forma más bonita de tenerlo siempre en casa. Cada vez que llego, lo primero que veo es su retrato. Gracias, Patapete.',
    avatarInitials: 'CB',
    photo: 'https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773768438251-b6cszct9tu8.webp',
    photoAlt: 'Tapete personalizado de dachshund sobre piso de madera',
  },
  {
    name: 'Valentina R.',
    city: 'Ciudad de México',
    petName: 'Salem',
    petType: 'Gato negro · 3 años',
    rating: 5,
    text: 'Tenía mis dudas de si quedaría bien con un gato — quedó PERFECTAMENTE. Salem parece molesto de que el tapete lo haga más famoso que él. El texto "Prepara tu soborno en atún" es exactamente su personalidad.',
    avatarInitials: 'VR',
    photo: 'https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773769457469-5us0oicamfm.webp',
    photoAlt: 'Salem el gato negro sentado junto a su tapete personalizado que dice Prepara tu soborno en atún',
  },
]

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5" aria-label={`${rating} estrellas de 5`}>
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'fill-primary text-primary' : 'text-border'}`}
      />
    ))}
  </div>
)

export const PatapeteTestimonials = () => {
  return (
    <section id="testimonios" className="section-padding texture-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">
            Reseñas reales
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Lo que dicen quienes ya tienen el suyo
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Más de 500 tapetes entregados. Estas son algunas de sus historias.
          </p>

          {/* Aggregate rating */}
          <div className="inline-flex items-center gap-3 mt-6 bg-card border border-border/60 rounded-2xl px-5 py-3 shadow-warm">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-primary text-primary" />
              ))}
            </div>
            <div className="text-left">
              <span className="font-bold text-foreground text-lg">4.9</span>
              <span className="text-muted-foreground text-sm ml-1.5">de 5 · 500+ reseñas</span>
            </div>
          </div>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {testimonials.map((t) => (
            <article
              key={t.name}
              className="card-premium flex flex-col hover:-translate-y-1 transition-transform duration-300 overflow-hidden"
            >
              {/* Real photo */}
              <div className="w-full h-44 overflow-hidden flex-shrink-0">
                <img
                  src={t.photo}
                  alt={t.photoAlt}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-5 flex flex-col gap-3 flex-1">
                {/* Stars */}
                <StarRating rating={t.rating} />

                {/* Quote */}
                <blockquote className="text-sm text-foreground leading-relaxed flex-1">
                  &ldquo;{t.text}&rdquo;
                </blockquote>

                {/* Pet name tag */}
                <div className="inline-flex items-center gap-1.5 self-start bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
                  🐾 {t.petName}
                </div>

                {/* Author */}
                <div className="flex items-center gap-3 pt-1 border-t border-border/50">
                  <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{t.avatarInitials}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-none">{t.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.city}</p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}