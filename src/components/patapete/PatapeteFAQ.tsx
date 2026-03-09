import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    q: '¿Cómo funciona exactamente?',
    a: 'Subes la foto de tu mascota, eliges el estilo de arte (Tatuaje IA, Vector o Icono), opcionalmente agregas nombre o frase, y el sistema te muestra un preview de cómo quedará tu tapete. Si te gusta, confirmas y pagamos. Si no, lo ajustas sin costo.',
  },
  {
    q: '¿El resultado final se parece al preview?',
    a: 'Sí, el preview es muy representativo del tapete final. Puede haber pequeñas variaciones por la textura natural de la fibra de coco, pero el diseño y composición serán muy similares a lo que viste antes de comprar.',
  },
  {
    q: '¿Puedo poner más de una mascota?',
    a: 'Claro. Puedes incluir hasta 3 mascotas en un mismo tapete. Solo necesitas subir una foto de cada una. El diseño las integra de forma armoniosa.',
  },
  {
    q: '¿Qué tipo de foto debo subir?',
    a: 'Cualquier foto donde se vea bien la carita de tu mascota: de frente, buena iluminación, sin objetos que tapen su cara. Cuanto mejor la foto, más detallado y bonito el resultado.',
  },
  {
    q: '¿Cuánto tarda en llegar?',
    a: 'El tiempo de producción es de 3 a 5 días hábiles, más el tiempo de envío según tu ubicación en México. En total estimamos entre 5 y 10 días hábiles desde que confirmas tu pedido.',
  },
  {
    q: '¿Aceptan devoluciones?',
    a: 'Como cada tapete se hace a pedido con el diseño de tu mascota, no aceptamos devoluciones por cambio de opinión. Sí cubrimos cualquier daño o defecto de producción — si llega roto o con error nuestro, lo reponemos sin costo.',
  },
  {
    q: '¿Qué pasa si mi foto no sirve?',
    a: 'Antes de procesar tu pedido revisamos que la foto sea apta para el diseño. Si hay algún problema, te contactamos por WhatsApp para que nos envíes una mejor foto, sin que tengas que pagar de nuevo.',
  },
]

export const PatapeteFAQ = () => {
  return (
    <section id="faq" className="section-padding texture-section">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">
            FAQ
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Preguntas frecuentes
          </h2>
          <p className="text-lg text-muted-foreground">
            Todo lo que necesitas saber antes de diseñar tu tapete.
          </p>
        </div>

        {/* Accordion */}
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="bg-card border border-border/60 rounded-2xl px-6 data-[state=open]:border-primary/30 data-[state=open]:shadow-warm transition-all duration-200"
            >
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-5 text-base leading-snug">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-5 text-sm">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}