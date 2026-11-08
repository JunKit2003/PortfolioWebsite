import { ConnectSection } from "@/components/ConnectSection"
import { EducationSection } from "@/components/EducationSection"
import { ExperienceSection } from "@/components/ExperienceSection"
import { HeroSection } from "@/components/HeroSection"
import { ProjectsSection } from "@/components/ProjectsSection"
import { SiteFooter } from "@/components/SiteFooter"
import { SiteHeader } from "@/components/SiteHeader"
import { StackSection } from "@/components/StackSection"

function App() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <HeroSection />
        <StackSection />
        <ProjectsSection />
        <ExperienceSection />
        <EducationSection />
        <ConnectSection />
      </main>
      <SiteFooter />
    </div>
  )
}

export default App
