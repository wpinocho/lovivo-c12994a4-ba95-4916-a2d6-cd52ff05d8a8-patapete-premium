import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { HelpCircle } from 'lucide-react'

const FAQ_ITEMS = [
  {
    question: '¿Cómo queda el tapete de verdad?',
    answer:
      'Es un tapete de fibra de coco natural, 60 × 40 cm, con base antideslizante. El diseño de tu mascota se procesa artísticamente y se transfiere al material con alta resolución. El preview que ves en pantalla es muy fiel al resultado final. La fibra de coco es firme, duradera y perfecta para la entrada de tu hogar.',
  },
  {
    question: '¿Qué pasa si el diseño no me convence?',
    answer:
      'Tenemos la Garantía Patapete: si el diseño final no te gusta, lo rehacemos sin costo adicional. Además, antes de producir, te enviamos el diseño por correo para tu aprobación. Solo empezamos a fabricar cuando tú das el visto bueno.',
  },
  {
    question: '¿Cuánto tarda en llegar mi tapete?',
    answer:
      'El proceso completo toma entre 7 y 10 días hábiles: creamos el diseño en 1-2 días, te lo enviamos para aprobación, y una vez aprobado la producción y envío toman otros 5-7 días. Enviamos a toda la República Mexicana.',
  },
  {
    question: '¿De qué material está hecho?',
    answer:
      'El tapete es 100% fibra de coco natural — ecológica, resistente y antideslizante. Apto para uso en interiores y entradas. Para limpiarlo, basta con sacudirlo o cepillarlo suavemente. Es un material que dura años con el uso cotidiano.',
  },
  {
    question: '¿Qué foto debo subir para el mejor resultado?',
    answer:
      'Lo ideal es una foto de frente, con buena iluminación y donde se vea claramente la cara o silueta de tu mascota. No importa si el fondo no es liso — nuestro sistema lo procesa automáticamente. Cuanto más nítida y bien iluminada sea la foto, mejor quedará el arte.',
  },
  {
    question: '¿Puedo ver el diseño antes de que lo produzcan?',
    answer:
      'Sí, siempre. Antes de fabricar el tapete te enviamos el diseño final por correo electrónico para tu aprobación. No producimos nada sin tu confirmación. El preview interactivo que ves al configurar es una vista previa muy similar al resultado final.',
  },
]

export function ProductFAQ() {
  return (
    <section className="space-y-4 pb-8">
      <div className="flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-primary flex-shrink-0" />
        <h2 className="text-lg font-bold text-foreground">Preguntas frecuentes</h2>
      </div>
      <Accordion type="single" collapsible className="space-y-2">
        {FAQ_ITEMS.map((item, index) => (
          <AccordionItem
            key={index}
            value={`item-${index}`}
            className="border border-border rounded-2xl px-4 data-[state=open]:bg-muted/20 transition-colors"
          >
            <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline py-4 text-left">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}