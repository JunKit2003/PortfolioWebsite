import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"

type Theme = "dark" | "light"

function getInitialTheme(): Theme {
  if (typeof document === "undefined") return "dark"
  return document.documentElement.classList.contains("light") ? "light" : "dark"
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const isLight = theme === "light"

  useEffect(() => {
    document.documentElement.classList.toggle("light", isLight)
    try {
      localStorage.setItem("theme", theme)
    } catch (error) {}
  }, [isLight, theme])

  return (
    <Button
      aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
      aria-pressed={isLight}
      onClick={() => setTheme(isLight ? "dark" : "light")}
      size="icon"
      type="button"
      variant="ghost"
    >
      {isLight ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
    </Button>
  )
}
