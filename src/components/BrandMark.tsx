import Image from 'next/image'

interface BrandMarkProps {
  size?: number
  priority?: boolean
  className?: string
  style?: React.CSSProperties
}

// The Bronit icon mark (public/assets/bronit-logo.png). It's a transparent PNG
// with its own gradient, so it sits on any background without a container tile.
// Works in both server and client components.
export function BrandMark({ size = 32, priority = false, className, style }: BrandMarkProps) {
  return (
    <Image
      src="/assets/bronit-logo.png"
      alt="Bronit"
      width={size}
      height={size}
      priority={priority}
      className={className}
      style={{ objectFit: 'contain', display: 'block', flexShrink: 0, ...style }}
    />
  )
}
