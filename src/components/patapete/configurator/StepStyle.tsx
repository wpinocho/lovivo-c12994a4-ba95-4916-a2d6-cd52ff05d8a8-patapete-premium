import { ReactNode } from 'react'
import { Style, PRICES } from './types'
import { Sparkles, Pen, PawPrint, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StyleOption {
  id: Style
  label: string
  tagline: string
  description: string
  icon: ReactNode
  featured?: boolean
  exampleUrl?: string
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'tattoo',
    label: 'Tatuaje IA',
    tagline: 'El más popular ⭐',
    description: 'Sube la foto de tu mascota y la IA la convierte en un retrato estilo tatuaje fino. Resultado único e irrepetible.',
    icon: <Sparkles className="w-6 h-6" />,
    featured: true,
    exampleUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop&q=80',
  },
  {
    id: 'vector',
    label: 'Vector',
    tagline: 'Moderno y minimalista',
    description: 'Tu foto se transforma en arte vectorial plano con colores vivos y trazos limpios. Estilo sticker ilustrado.',
    icon: <Pen className="w-6 h-6" />,
    exampleUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&q=80',
  },
  {
    id: 'icon',
    label: 'Ícono de Raza',
    tagline: 'Listo al instante',
    description: 'Elige la raza de tu mascota de nuestro catálogo de ilustraciones. Preview instantánea, sin esperas.',
    icon: <PawPrint className="w-6 h-6" />,
    exampleUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop&q=80',
  },
]

interface StepStyleProps {
  selected: Style | null
  onSelect: (style: Style) => void
}

export function StepStyle({ selected, onSelect }: StepStyleProps) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-1 mb-6">
        <h2 className="text-2xl font-bold text-foreground">¿Qué estilo quieres?</h2>
        <p className="text-muted-foreground">Elige cómo quedará la imagen de tu mascota en el tapete</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {STYLE_OPTIONS.map((opt) => {
          const isSelected = selected === opt.id
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className={cn(
                'relative text-left rounded-2xl border-2 p-5 transition-all duration-200 hover:shadow-lg group overflow-hidden',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
                  : 'border-border bg-card hover:border-primary/40',
                opt.featured && !isSelected && 'border-amber-400/60 bg-amber-50/30'
              )}
            >
              {/* Featured badge */}
              {opt.featured && (
                <div className="absolute top-3 right-3">
                  <span className="text-xs font-semibold bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full">
                    Popular
                  </span>
                </div>
              )}

              {/* Selected check */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
              )}

              {/* Icon */}
              <div className={cn(
                'w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-colors',
                isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
              )}>
                {opt.icon}
              </div>

              {/* Content */}
              <div className="space-y-1">
                <p className="font-bold text-foreground text-lg leading-tight">{opt.label}</p>
                <p className={cn(
                  'text-xs font-medium',
                  opt.featured ? 'text-amber-600' : 'text-muted-foreground'
                )}>
                  {opt.tagline}
                </p>
                <p className="text-sm text-muted-foreground leading-snug mt-2">
                  {opt.description}
                </p>
              </div>

              {/* Price */}
              <div className="mt-4 pt-3 border-t border-border/50">
                <span className="text-xs text-muted-foreground">Desde </span>
                <span className="font-bold text-foreground">
                  ${PRICES[opt.id][1].toLocaleString('es-MX')} MXN
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}