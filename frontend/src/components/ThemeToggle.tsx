import { Moon, Sun } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useState, type MouseEvent } from "react"
import { flushSync } from "react-dom"

type Theme = "dark" | "light"

function currentTheme(): Theme {
  if (typeof document === "undefined") return "dark"
  return document.documentElement.classList.contains("light") ? "light" : "dark"
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("light", theme === "light")
  try {
    localStorage.setItem("theme", theme)
  } catch {
    // Private mode or storage disabled: the theme still applies for this visit.
  }
}

/**
 * Switches theme with a circular wipe that grows out of the button
 * (View Transitions API), falling back to an instant switch.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(currentTheme)
  const isLight = theme === "light"

  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    const next: Theme = isLight ? "dark" : "light"
    const swap = () => {
      applyTheme(next)
      flushSync(() => setTheme(next))
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!document.startViewTransition || reduced) {
      swap()
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))

    const transition = document.startViewTransition(swap)
    transition.ready
      .then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 700, easing: "cubic-bezier(.16,1,.3,1)", pseudoElement: "::view-transition-new(root)" },
        )
      })
      .catch(() => {})
  }

  return (
    <button
      aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
      aria-pressed={isLight}
      className="relative grid size-10 place-items-center overflow-hidden rounded-full text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
      onClick={toggle}
      type="button"
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
          initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
          key={theme}
          transition={{ duration: 0.25 }}
        >
          {isLight ? <Moon aria-hidden="true" className="size-[18px]" /> : <Sun aria-hidden="true" className="size-[18px]" />}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
