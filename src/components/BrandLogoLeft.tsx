interface BrandLogoLeftProps {
  transparent?: boolean
}

export const BrandLogoLeft = ({ transparent = false }: BrandLogoLeftProps) => {
  return (
    <a
      href="/"
      aria-label="Patapete - Tapetes personalizados para mascotas"
      className="flex items-center gap-2 hover:opacity-85 transition-opacity"
    >
      <img
        src="/logo.webp"
        alt="Patapete logo"
        width={36}
        height={36}
        className="shrink-0 object-contain transition-all duration-300"
        style={{
          filter: transparent
            ? 'brightness(0) invert(1) drop-shadow(0 1px 3px rgba(0,0,0,0.4))'
            : 'drop-shadow(0 1px 2px rgba(0,0,0,0.12))'
        }}
      />
      <span
        className="font-display text-[1.35rem] font-bold tracking-tight leading-none transition-colors duration-300"
        style={{ color: transparent ? 'white' : 'currentColor' }}
      >
        Patapete
      </span>
    </a>
  )
}