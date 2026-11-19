import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useEffect, useState } from "react"

/** Cycles through phrases with a vertical flip. Announces only the first phrase to screen readers. */
export function RotatingWords({ words, interval = 2600 }: { words: string[]; interval?: number }) {
  const [index, setIndex] = useState(0)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % words.length), interval)
    return () => window.clearInterval(id)
  }, [interval, reduced, words.length])

  return (
    <span className="relative inline-grid overflow-hidden align-bottom">
      <span className="sr-only">{words[0]}</span>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
          aria-hidden="true"
          className="text-gradient col-start-1 row-start-1 whitespace-nowrap pb-[0.12em] pr-[0.08em]"
          exit={{ y: "-100%", opacity: 0, filter: "blur(6px)" }}
          initial={{ y: "100%", opacity: 0, filter: "blur(6px)" }}
          key={words[index]}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
