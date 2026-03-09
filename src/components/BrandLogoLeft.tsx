export const BrandLogoLeft = () => {
  return (
    <a
      href="/"
      aria-label="Patapete - Tapetes personalizados para mascotas"
      className="flex items-center gap-2.5 text-current hover:opacity-85 transition-opacity"
    >
      {/* Paw print SVG icon */}
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Main pad */}
        <ellipse cx="16" cy="22" rx="8.5" ry="7.5" />
        {/* Toe pads */}
        <ellipse cx="7" cy="13" rx="3.5" ry="3" />
        <ellipse cx="25" cy="13" rx="3.5" ry="3" />
        <ellipse cx="11.5" cy="8.5" rx="3" ry="2.8" />
        <ellipse cx="20.5" cy="8.5" rx="3" ry="2.8" />
      </svg>

      <span
        className="font-display text-[1.35rem] font-bold tracking-tight leading-none"
        style={{ color: 'currentColor' }}
      >
        Patapete
      </span>
    </a>
  )
}