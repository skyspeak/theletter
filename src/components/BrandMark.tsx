interface BrandMarkProps {
  size?: 'sm' | 'lg'
  as?: 'div' | 'h1'
  compact?: boolean
}

export function BrandMark({ size = 'sm', as: Tag = 'div', compact = false }: BrandMarkProps) {
  const isLg = size === 'lg'
  const logoClass = isLg ? 'h-10 w-10 sm:h-16 sm:w-16' : 'h-7 w-7 shrink-0'

  return (
    <Tag
      className={`inline-flex items-center gap-2 sm:gap-3 font-serif font-medium tracking-tight text-ink ${
        isLg
          ? 'text-3xl sm:text-7xl justify-center flex-wrap text-balance'
          : compact
            ? 'text-base sm:text-xl'
            : 'text-xl'
      }`}
    >
      <img
        src={`${import.meta.env.BASE_URL}chinchilla.png`}
        alt=""
        aria-hidden="true"
        className={`${logoClass} shrink-0 rounded-sm [image-rendering:pixelated]`}
      />
      <span>
        <span>dear</span>
        <span className="text-primary">[</span>
        <span className="text-primary">CC</span>
        <span className="text-primary">]</span>
        <span> The Letter</span>
      </span>
    </Tag>
  )
}
