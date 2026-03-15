export const BrandLogoLeft = () => {
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
        className="shrink-0 object-contain"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.12))' }}
      />
      <span
        className="font-display text-[1.35rem] font-bold tracking-tight leading-none"
        style={{ color: 'currentColor' }}
      >
        Patapete
      </span>
    </a>
  )
}