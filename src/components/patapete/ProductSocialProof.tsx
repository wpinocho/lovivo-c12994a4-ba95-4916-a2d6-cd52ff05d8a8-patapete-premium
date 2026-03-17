import { Star } from 'lucide-react'

const REVIEWS = [
  {
    name: 'María G.',
    initials: 'MG',
    city: 'Ciudad de México',
    petName: 'Buddy',
    text: 'Nunca imaginé que un tapete pudiera hacerme llorar de emoción. El de Buddy quedó perfectamente igual a él, la cara, la expresión, todo. Mis visitas siempre preguntan dónde lo compré.',
    stars: 5,
    tapeteImg: 'https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/product-images/c12994a4-ba95-4916-a2d6-cd52ff05d8a8/review-buddy.webp',
    tapeteAlt: 'Tapete de Buddy el Golden Retriever recién desempacado',
    imgWidth: 399,
    imgHeight: 534,
  },
  {
    name: 'Rodrigo M.',
    initials: 'RM',
    city: 'Guadalajara',
    petName: 'Rocco',
    text: 'Lo pedí como regalo para mi mamá y no pudo creer que fuera real. Dijo que era el regalo más bonito que le habían dado. Rocco ya tiene su trono en la entrada.',
    stars: 5,
    tapeteImg: 'https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/product-images/c12994a4-ba95-4916-a2d6-cd52ff05d8a8/review-rocco.webp',
    tapeteAlt: 'Rocco el pastor alemán junto a su tapete personalizado en la cocina',
    imgWidth: 399,
    imgHeight: 534,
  },
  {
    name: 'Sofía V.',
    initials: 'SV',
    city: 'Monterrey',
    petName: 'Rocco, Buddy y Coco',
    text: 'Tenemos tres perros así que pedí uno con los tres juntos. El resultado superó todas mis expectativas, la calidad del material y el nivel de detalle del diseño son increíbles.',
    stars: 5,
    tapeteImg: 'https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/product-images/c12994a4-ba95-4916-a2d6-cd52ff05d8a8/review-triple.webp',
    tapeteAlt: 'Tapete personalizado con tres perros: Rocco, Buddy y Coco',
    imgWidth: 399,
    imgHeight: 534,
  },
  {
    name: 'Carlos B.',
    initials: 'CB',
    city: 'Puebla',
    petName: 'Milo',
    text: 'Mi perro falleció hace unos meses. Este tapete se convirtió en la forma más bonita de tenerlo siempre en casa. Cada vez que llego, lo primero que veo es su retrato.',
    stars: 5,
    tapeteImg: 'https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/product-images/c12994a4-ba95-4916-a2d6-cd52ff05d8a8/review-milo.webp',
    tapeteAlt: 'Tapete personalizado de dachshund sobre piso de madera',
    imgWidth: 399,
    imgHeight: 534,
  },
  {
    name: 'Valentina R.',
    initials: 'VR',
    city: 'Ciudad de México',
    petName: 'Salem',
    text: 'Tenía mis dudas de si quedaría bien con un gato, pero quedó PERFECTAMENTE. Salem parece molesto de que el tapete lo haga más famoso que él. El texto en el tapete es exactamente su personalidad.',
    stars: 5,
    tapeteImg: 'https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/product-images/c12994a4-ba95-4916-a2d6-cd52ff05d8a8/review-salem.webp',
    tapeteAlt: 'Salem el gato negro sentado junto a su tapete personalizado que dice Prepara tu soborno en atún',
    imgWidth: 399,
    imgHeight: 534,
  },
]

function StarRow({ count, size = 'sm' }: { count: number; size?: 'sm' | 'xs' }) {
  const cls = size === 'sm' ? 'w-3.5 h-3.5' : 'w-3 h-3'
  return (
    <div className="flex">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className={`${cls} fill-amber-400 text-amber-400`} />
      ))}
    </div>
  )
}

export function ProductSocialProof() {
  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 bg-muted/50 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-1.5">
          <StarRow count={5} />
          <span className="font-bold text-foreground ml-1">4.9</span>
          <span className="text-muted-foreground text-sm">/ 5</span>
        </div>
        <span className="text-muted-foreground text-sm hidden sm:inline">·</span>
        <span className="text-sm font-semibold text-foreground">+500 tapetes entregados</span>
        <span className="text-muted-foreground text-sm hidden sm:inline">·</span>
        <div className="flex items-center gap-1.5 text-sm text-primary font-medium">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          14 personas configurando ahora
        </div>
      </div>

      {/* Mini reviews */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {REVIEWS.map((review) => (
          <div
            key={review.name}
            className="rounded-2xl border border-border bg-card overflow-hidden"
          >
            {/* Tapete photo — fixed container height prevents CLS */}
            <div className="w-full h-44 overflow-hidden bg-muted">
              <img
                src={review.tapeteImg}
                alt={review.tapeteAlt}
                loading="lazy"
                decoding="async"
                width={review.imgWidth}
                height={review.imgHeight}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-4 space-y-2.5">
              {/* Stars */}
              <StarRow count={review.stars} />

              {/* Quote */}
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{review.text}</p>

              {/* Pet tag */}
              <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
                🐾 {review.petName}
              </span>

              {/* Author */}
              <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                <div className="w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {review.initials}
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground leading-none">{review.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{review.city}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}