import { Eye, Heart, Gift, Layers, ShoppingBag, Users } from 'lucide-react'

const benefits = [
  {
    icon: Eye,
    title: 'Preview antes de comprar',
    desc: 'Ves exactamente cómo quedará tu tapete antes de hacer cualquier pago. Sin sorpresas.',
  },
  {
    icon: Heart,
    title: 'Hecho para tu mascota',
    desc: 'No hay dos tapetes iguales. Cada uno se crea especialmente con la foto de tu peludo.',
  },
  {
    icon: Gift,
    title: 'El regalo que nadie ha visto',
    desc: 'Para cumpleaños, Navidad o simplemente porque sí. Se empaca muy bien para regalar.',
  },
  {
    icon: Layers,
    title: 'Hasta 3 mascotas en uno',
    desc: 'Tienes perro y gato, o tres perros. Los pones todos en el mismo tapete.',
  },
  {
    icon: ShoppingBag,
    title: 'Compra fácil y rápida',
    desc: 'Sube la foto, elige el estilo, ve el preview y paga. Todo en minutos desde tu cel.',
  },
  {
    icon: Users,
    title: 'Soporte real por WhatsApp',
    desc: 'Si tienes dudas con tu foto o diseño, te ayudamos directo por WhatsApp.',
  },
]

export const PatapeteBenefits = () => {
  return (
    <section id="beneficios" className="section-padding bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">
            Por qué Patapete
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Un tapete que cuenta tu historia
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            No es solo un tapete. Es el arte de tu mascota todos los días en la entrada de tu casa.
          </p>
        </div>

        {/* Benefits grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group p-6 rounded-2xl border border-border/60 bg-card hover:border-primary/30 hover:shadow-warm transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-200">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-base">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}