import { Star } from 'lucide-react'

const TAPETE_IMAGE = 'https://ptgmltivisbtvmoxwnhd.supabase.co/storage/v1/object/public/message-images/1ccf5285-0be5-40c1-a9a6-e9894185f538/1773605369513-eutj0l5ssem.webp'

const REVIEWS = [
  {
    name: 'Ana T.',
    initials: 'AT',
    text: 'Pedí el tapete con mi perrita Mochi y quedó increíble. Todos en casa lo aman y preguntan dónde lo conseguí.',
    stars: 5,
    tapeteImg: TAPETE_IMAGE,
    tag: 'Mochi 🐩',
  },
  {
    name: 'Carlos M.',
    initials: 'CM',
    text: 'Lo regalé a mi mamá con su gato Canela para su cumpleaños. La hizo llorar de emoción. Hermoso y muy fácil de pedir.',
    stars: 5,
    tapeteImg: null,
    tag: null,
  },
  {
    name: 'Sara P.',
    initials: 'SP',
    text: 'Proceso súper fácil y el resultado quedó espectacular. La calidad del tapete supera mis expectativas.',
    stars: 5,
    tapeteImg: null,
    tag: null,
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {REVIEWS.map((review) => (
          <div
            key={review.name}
            className="rounded-2xl border border-border bg-card p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary/15 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {review.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight">{review.name}</p>
                  <StarRow count={review.stars} size="xs" />
                </div>
              </div>
              {review.tapeteImg && (
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-border">
                  <img
                    src={review.tapeteImg}
                    alt="Tapete personalizado Patapete"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{review.text}</p>
            {review.tag && (
              <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
                {review.tag}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}