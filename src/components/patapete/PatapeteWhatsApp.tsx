import { MessageCircle } from 'lucide-react'

export const PatapeteWhatsApp = () => {
  const waUrl = 'https://wa.me/5215500000000?text=Hola%20Patapete%2C%20quisiera%20informaci%C3%B3n%20sobre%20mi%20tapete%20personalizado%20%F0%9F%90%BE'

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar a Patapete por WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 hover:-translate-y-0.5"
      style={{ backgroundColor: '#25D366' }}
    >
      <MessageCircle className="h-7 w-7 text-white" fill="white" />
    </a>
  )
}