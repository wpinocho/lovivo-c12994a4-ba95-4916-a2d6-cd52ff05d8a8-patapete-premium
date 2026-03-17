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
      'Es un tapete de 60 × 40 cm con base antideslizante. Tiene la textura y el carácter de la fibra de coco tradicional, pero con una gran ventaja: el diseño de tu mascota se imprime por sublimación directamente en el material — no está pintado por encima. El resultado es muy fiel al preview que ves antes de pagar.',
  
  },
  {
    question: '¿Qué garantía tienen?',
    answer:
      'Garantía Patapete: si tu tapete llega con algún defecto de fabricación — impresión dañada, material roto, cualquier falla física — lo reponemos sin costo. Sin preguntas. Recuerda que tú ya viste y aprobaste cómo queda el diseño en el preview antes de ordenar, así que el resultado será exactamente lo que viste.',
  },
  {
    question: '¿Cuánto tarda en llegar mi tapete?',
    answer:
      'Una vez confirmado tu pedido empezamos producción de inmediato. La fabricación toma entre 3 y 5 días hábiles, después lo enviamos con número de rastreo a tu correo. En total, tu tapete llega entre 7 y 10 días hábiles desde la compra. Enviamos a toda la República Mexicana.',
  },
  {
    question: '¿De qué material está hecho?',
    answer:
      'El tapete está hecho de fibra sintética premium con la misma textura tipo coco. La diferencia clave: usamos impresión por sublimación HD, que funde los colores dentro del material. No se pela, no se agrieta y aguanta lluvia, lodo y uso diario sin problema. Para mantener los colores vibrantes por más tiempo, recomendamos colocarlo en entradas techadas o interiores, lejos del sol directo prolongado.',
  
  },
  {
    question: '¿Qué foto debo subir para el mejor resultado?',
    answer:
      'Lo ideal es una foto de frente, con buena iluminación y donde se vea claramente la cara o silueta de tu mascota. No importa si el fondo no es liso — nuestro sistema lo procesa automáticamente. Cuanto más nítida y bien iluminada sea la foto, mejor quedará el arte.',
  },
  {
    question: '¿El preview que veo es el diseño real del tapete?',
    answer:
      'Exactamente. El preview interactivo que ves al configurar tu tapete es una representación muy fiel del resultado final — el mismo diseño, composición y texto. Eso es uno de los grandes valores de Patapete: tú apruebas cómo queda antes de pagar. Una vez que confirmas la compra, producimos el tapete con ese diseño.',
  },
  {
    question: '¿Dónde lo coloco para que dure más tiempo?',
    answer:
      'El tapete resiste lluvia, lodo y manguerazos sin ningún problema. Para mantener los colores de tu mascota vibrantes por años, recomendamos colocarlo en entradas techadas, porches o pasillos interiores, evitando la exposición directa y prolongada al sol. Igual que cualquier tela o tapete de color — el sol intenso desgasta los pigmentos con el tiempo.',
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