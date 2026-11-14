import { useEffect, useRef, useState } from "react"

type CountUpProps = {
  value: number
  duration?: number
}

function getInitialDisplay(value: number) {
  if (typeof window === "undefined") return 0
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? value : 0
}

export function CountUp({ value, duration = 1200 }: CountUpProps) {
  const [display, setDisplay] = useState(() => getInitialDisplay(value))
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches

    if (prefersReducedMotion) return

    let frameId: number | undefined
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || started.current) return
          started.current = true

          const start = performance.now()
          const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1)
            setDisplay(Math.round(progress * value))
            if (progress < 1) frameId = requestAnimationFrame(tick)
          }

          frameId = requestAnimationFrame(tick)
          observer.disconnect()
        })
      },
      { threshold: 0.5 },
    )

    observer.observe(node)
    return () => {
      observer.disconnect()
      if (frameId !== undefined) cancelAnimationFrame(frameId)
    }
  }, [duration, value])

  return <span ref={ref}>{display}</span>
}
