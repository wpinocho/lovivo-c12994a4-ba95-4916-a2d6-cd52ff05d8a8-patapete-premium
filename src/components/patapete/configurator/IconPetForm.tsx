import { AnimalType, Pet } from './types'
import { BREEDS, DOG_BREEDS, CAT_BREEDS } from '@/data/breedData'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface IconPetFormProps {
  petIndex: number
  pet: Pet
  onChange: (updates: Partial<Pet>) => void
}

export function IconPetForm({ petIndex, pet, onChange }: IconPetFormProps) {
  const breedList = pet.animalType === 'dog' ? DOG_BREEDS : CAT_BREEDS

  return (
    <div className="space-y-5">
      {/* Animal type toggle */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground">
          Mascota {petIndex + 1} — Tipo
        </Label>
        <div className="flex gap-2">
          {(['dog', 'cat'] as AnimalType[]).map(type => (
            <button
              key={type}
              onClick={() => onChange({ animalType: type, breedId: type === 'dog' ? 'labrador' : 'cat-mestizo' })}
              className={cn(
                'flex-1 py-2.5 px-4 rounded-xl border-2 font-medium text-sm transition-all',
                pet.animalType === type
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground hover:border-primary/40'
              )}
            >
              {type === 'dog' ? '🐶 Perro' : '🐱 Gato'}
            </button>
          ))}
        </div>
      </div>

      {/* Breed grid */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground">Raza</Label>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-60 overflow-y-auto pr-1">
          {breedList.map(breed => (
            <button
              key={breed.id}
              onClick={() => onChange({ breedId: breed.id })}
              className={cn(
                'relative flex flex-col items-center gap-1 p-1.5 rounded-xl border-2 transition-all',
                pet.breedId === breed.id
                  ? 'border-primary bg-primary/8 ring-2 ring-primary/20'
                  : 'border-border bg-card hover:border-primary/40'
              )}
            >
              <div className="w-full aspect-square rounded-lg overflow-hidden bg-muted/80">
                <img
                  src={breed.imageUrl}
                  alt={breed.label}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <span className="text-[10px] font-medium leading-tight text-center text-muted-foreground line-clamp-2">
                {breed.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Pet name */}
      <div className="space-y-1.5">
        <Label htmlFor={`pet-name-${petIndex}`} className="text-sm font-semibold text-foreground">
          Nombre <span className="font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <Input
          id={`pet-name-${petIndex}`}
          placeholder={`Ej: Max, Luna, Frijol...`}
          value={pet.name}
          onChange={e => onChange({ name: e.target.value })}
          maxLength={20}
          className="rounded-xl"
        />
      </div>
    </div>
  )
}