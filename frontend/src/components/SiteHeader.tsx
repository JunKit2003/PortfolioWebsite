import { useEffect, useRef, useState } from "react"
import { Menu, X } from "lucide-react"

import { ThemeToggle } from "@/components/ThemeToggle"
import { Button } from "@/components/ui/button"
import { useActiveSection } from "@/hooks/useActiveSection"

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
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const activeSection = useActiveSection(sectionIds)

  useEffect(() => {
    if (!isMenuOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }

    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [isMenuOpen])

  return (
    <header className="site-header">
      <nav className="content-container site-nav" aria-label="Primary navigation">
        <a className="site-brand" href="#about" onClick={() => setIsMenuOpen(false)}>
          Chee Jun Kit
        </a>
        <div className={isMenuOpen ? "site-nav-links is-open" : "site-nav-links"} id="primary-navigation">
          {navigationItems.map((item) => {
            const isActive = activeSection === item.href.slice(1)
            return (
              <a
                aria-current={isActive ? "page" : undefined}
                className={isActive ? "is-active" : undefined}
                href={item.href}
                key={item.href}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </a>
            )
          })}
        </div>
        <div className="site-nav-actions">
          <ThemeToggle />
          <Button
            aria-controls="primary-navigation"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
            className="site-nav-toggle"
            onClick={() => setIsMenuOpen((open) => !open)}
            ref={menuButtonRef}
            size="icon"
            type="button"
            variant="ghost"
          >
            {isMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </Button>
        </div>
      </nav>
    </header>
  )
}
