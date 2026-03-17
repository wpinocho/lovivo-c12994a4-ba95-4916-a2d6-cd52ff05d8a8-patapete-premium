import { useEffect, useRef, useState } from 'react'
import { MapPin, Eye, Shield, Sparkles, Package } from 'lucide-react'

const items = [
  { icon: MapPin, label: 'Hecho a pedido en México' },
  { icon: Sparkles, label: 'Personalizado con tu mascota' },
  { icon: Eye, label: 'Vista previa antes de comprar' },
  { icon: Shield, label: 'Garantía por daño o defecto' },
  { icon: Package, label: 'Producción artesanal' },
]

// Duplicate items for seamless desktop marquee loop
const marqueeItems = [...items, ...items]

// Mobile: auto-sliding strip
const MobileTrustStrip = () => {
  const [current, setCurrent] = useState(0)
  const [sliding, setSliding] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const schedule = () => {
      timeoutRef.current = setTimeout(() => {
        // Trigger slide-out
        setSliding(true)
        // After slide animation (300ms), change item and slide back in
        setTimeout(() => {
          setCurrent(prev => (prev + 1) % items.length)
          setSliding(false)
        }, 300)
        schedule()
      }, 2000)
    }
    schedule()
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const { icon: Icon, label } = items[current]

  return (
    <section id="confianza" className="bg-secondary border-y border-border/60 py-4 overflow-hidden md:hidden">
      <div
        className="flex items-center justify-center gap-2.5 text-foreground/80 transition-all duration-300"
        style={{
          opacity: sliding ? 0 : 1,
          transform: sliding ? 'translateX(-24px)' : 'translateX(0)',
        }}
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-medium whitespace-nowrap">{label}</span>
      </div>
    </section>
  )
}

// Desktop: classic infinite marquee
const DesktopTrustStrip = () => (
  <section id="confianza" className="bg-secondary border-y border-border/60 py-5 overflow-hidden hidden md:block">
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

export const PatapeteTrustStrip = () => {
  // Render both and toggle via CSS (md:hidden / hidden md:block)
  return (
    <>
      <MobileTrustStrip />
      <DesktopTrustStrip />
    </>
  )
}