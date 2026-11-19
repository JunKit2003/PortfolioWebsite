import { motion, useMotionValue, useScroll, useSpring } from "motion/react"
import { useEffect, useState } from "react"

/** Soft glow that trails the mouse across the whole page (fine pointers only). */
export function CursorGlow() {
  const x = useSpring(useMotionValue(-1000), { stiffness: 120, damping: 24 })
  const y = useSpring(useMotionValue(-1000), { stiffness: 120, damping: 24 })
  const [enabled] = useState(() => window.matchMedia("(pointer: fine)").matches)

  useEffect(() => {
    if (!enabled) return
    const move = (event: PointerEvent) => {
      x.set(event.clientX)
      y.set(event.clientY)
    }
    window.addEventListener("pointermove", move, { passive: true })
    return () => window.removeEventListener("pointermove", move)
  }, [enabled, x, y])

  if (!enabled) return null
  return <motion.div aria-hidden="true" className="cursor-glow" style={{ x, y }} />
}

/** Thin gradient bar across the top that fills as you scroll. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 })
  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[70] h-[2px] origin-left bg-gradient-to-r from-a1 via-a3 to-a2"
      style={{ scaleX }}
    />
  )
}

export function Grain() {
  return <div aria-hidden="true" className="grain" />
}
