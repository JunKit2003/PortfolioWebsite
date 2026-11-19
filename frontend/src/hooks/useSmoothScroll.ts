import Lenis from "lenis"
import { useEffect } from "react"

/** Inertial smooth scrolling (Lenis), including in-page anchor links. Off for reduced motion. */
export function useSmoothScroll(): void {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const lenis = new Lenis({
      anchors: true, // lands using the CSS scroll-padding-top
      autoRaf: true,
      lerp: 0.1,
    })

    return () => lenis.destroy()
  }, [])
}
