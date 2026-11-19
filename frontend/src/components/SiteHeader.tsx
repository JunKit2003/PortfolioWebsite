import { Menu, X } from "lucide-react"
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react"
import { useEffect, useRef, useState } from "react"

import { ThemeToggle } from "@/components/ThemeToggle"
import { useActiveSection } from "@/hooks/useActiveSection"
import { cn } from "@/lib/utils"

const navigationItems = [
  { href: "#about", label: "About" },
  { href: "#stack", label: "Stack" },
  { href: "#projects", label: "Projects" },
  { href: "#experience", label: "Experience" },
  { href: "#education", label: "Education" },
  { href: "#connect", label: "Connect" },
]

const sectionIds = navigationItems.map((item) => item.href.slice(1))

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const activeSection = useActiveSection(sectionIds)
  const { scrollY } = useScroll()

  // Tuck the bar away while scrolling down; bring it back on any scroll up.
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0
    setScrolled(latest > 24)
    setHidden(latest > 480 && latest > previous + 4)
    if (latest < previous - 4) setHidden(false)
  })

  useEffect(() => {
    if (!isMenuOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", closeOnEscape)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", closeOnEscape)
    }
  }, [isMenuOpen])

  return (
    <>
      <motion.header
        animate={{ y: hidden && !isMenuOpen ? -120 : 0 }}
        className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:pt-4"
        initial={{ y: -120 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <nav
          aria-label="Primary navigation"
          className={cn(
            "mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-full py-2 pr-2 pl-5 transition-[background-color,border-color,box-shadow] duration-500",
            scrolled || isMenuOpen
              ? "glass shadow-[0_10px_40px_-12px_rgb(0_0_0/0.45)]"
              : "border border-transparent",
          )}
        >
          <a
            className="flex items-center gap-2.5 font-semibold tracking-tight"
            href="#about"
            onClick={() => setIsMenuOpen(false)}
          >
            <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-a1 via-a3 to-a2 font-mono text-[0.65rem] font-bold text-white">
              JK
            </span>
            <span className="hidden sm:inline">Chee Jun Kit</span>
          </a>

          <ul className="hidden items-center gap-1 md:flex">
            {navigationItems.map((item) => {
              const isActive = activeSection === item.href.slice(1)
              return (
                <li key={item.href}>
                  <a
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "relative block rounded-full px-4 py-2 text-sm transition-colors",
                      isActive ? "text-fg" : "text-fg-muted hover:text-fg",
                    )}
                    href={item.href}
                  >
                    {isActive ? (
                      <motion.span
                        className="absolute inset-0 -z-10 rounded-full border border-line-strong bg-surface-hover"
                        layoutId="nav-active"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    ) : null}
                    {item.label}
                  </a>
                </li>
              )
            })}
          </ul>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              aria-controls="mobile-navigation"
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
              className="grid size-10 place-items-center rounded-full text-fg-muted hover:bg-surface-hover hover:text-fg md:hidden"
              onClick={() => setIsMenuOpen((open) => !open)}
              ref={menuButtonRef}
              type="button"
            >
              {isMenuOpen ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {isMenuOpen ? (
          <motion.div
            animate={{ clipPath: "circle(150% at calc(100% - 2.5rem) 2.5rem)" }}
            className="fixed inset-0 z-40 flex flex-col justify-end bg-bg px-6 pb-10 md:hidden"
            exit={{ clipPath: "circle(0% at calc(100% - 2.5rem) 2.5rem)" }}
            id="mobile-navigation"
            initial={{ clipPath: "circle(0% at calc(100% - 2.5rem) 2.5rem)" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div aria-hidden="true" className="aurora opacity-60">
              <span />
              <span />
              <span />
            </div>
            <ul className="relative flex flex-col gap-1">
              {navigationItems.map((item, index) => (
                <motion.li
                  animate={{ opacity: 1, y: 0 }}
                  initial={{ opacity: 0, y: 40 }}
                  key={item.href}
                  transition={{ delay: 0.12 + index * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <a
                    aria-current={activeSection === item.href.slice(1) ? "page" : undefined}
                    className="flex items-baseline gap-4 py-1 text-5xl font-semibold tracking-[-0.045em]"
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="font-mono text-xs tracking-widest text-a2">0{index}</span>
                    {item.label}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
