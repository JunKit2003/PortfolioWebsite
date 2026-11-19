import type { CSSProperties, ReactNode } from "react"

type MarqueeProps = {
  children: ReactNode
  reverse?: boolean
  duration?: number
}

/** Decorative infinite horizontal scroller (content must also exist elsewhere for assistive tech). */
export function Marquee({ children, reverse = false, duration = 40 }: MarqueeProps) {
  return (
    <div
      aria-hidden="true"
      className="marquee"
      data-reverse={reverse}
      style={{ "--duration": `${duration}s` } as CSSProperties}
    >
      <div className="marquee-track">{children}</div>
      <div className="marquee-track">
        {children}
      </div>
    </div>
  )
}
