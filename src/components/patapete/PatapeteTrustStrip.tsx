import { MapPin, Eye, Shield, Sparkles, Package } from 'lucide-react'

const items = [
  { icon: MapPin, label: 'Hecho a pedido en México' },
  { icon: Sparkles, label: 'Personalizado con tu mascota' },
  { icon: Eye, label: 'Vista previa antes de comprar' },
  { icon: Shield, label: 'Garantía por daño o defecto' },
  { icon: Package, label: 'Producción artesanal' },
]

// Duplicate items to create a seamless infinite loop
const marqueeItems = [...items, ...items]

export const PatapeteTrustStrip = () => {
  return (
    <section id="confianza" className="bg-secondary border-y border-border/60 py-5 overflow-hidden">
      <div className="flex animate-marquee">
        {marqueeItems.map(({ icon: Icon, label }, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 shrink-0 text-foreground/80 px-8"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-medium whitespace-nowrap">{label}</span>
            <div className="w-px h-5 bg-border ml-4 shrink-0" />
          </div>
        ))}
      </div>
    </section>
  )
}