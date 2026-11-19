import { motion } from "motion/react"

import { cn } from "@/lib/utils"

type SplitTextProps = {
  text: string
  className?: string
  delay?: number
  stagger?: number
}

/** Letters rise out of a blur one by one. Screen readers get the whole string. */
export function SplitText({ text, className, delay = 0, stagger = 0.035 }: SplitTextProps) {
  const words = text.split(" ")
  let index = 0

  return (
    <span aria-label={text} className={cn("inline-block", className)} role="text">
      {words.map((word, wordIndex) => (
        <span aria-hidden="true" className="inline-block whitespace-nowrap" key={`${word}-${wordIndex}`}>
          {Array.from(word).map((char) => {
            const i = index++
            return (
              <motion.span
                animate={{ opacity: 1, y: "0%", filter: "blur(0px)", rotate: 0 }}
                className="inline-block will-change-transform"
                initial={{ opacity: 0, y: "60%", filter: "blur(12px)", rotate: 6 }}
                key={i}
                transition={{ delay: delay + i * stagger, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              >
                {char}
              </motion.span>
            )
          })}
          {wordIndex < words.length - 1 ? <span className="inline-block">&nbsp;</span> : null}
        </span>
      ))}
    </span>
  )
}
