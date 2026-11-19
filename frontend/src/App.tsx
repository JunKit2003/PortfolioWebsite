import { MotionConfig } from "motion/react"

import { CursorGlow, Grain, ScrollProgress } from "@/components/fx/Ambient"
import { Connect } from "@/components/sections/Connect"
import { Education, Experience } from "@/components/sections/Experience"
import { Hero } from "@/components/sections/Hero"
import { Projects } from "@/components/sections/Projects"
import { Stack } from "@/components/sections/Stack"
import { SiteHeader } from "@/components/SiteHeader"
import { useSmoothScroll } from "@/hooks/useSmoothScroll"

function App() {
  useSmoothScroll()

  return (
    <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <ScrollProgress />
      <CursorGlow />
      <Grain />
      <SiteHeader />
      <main className="relative z-[2]" id="main">
        <Hero />
        <Stack />
        <Projects />
        <Experience />
        <Education />
        <Connect />
      </main>
    </MotionConfig>
  )
}

export default App
