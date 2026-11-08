import { HeroSection } from "@/components/HeroSection"
import { SectionHeading } from "@/components/SectionHeading"
import { SiteFooter } from "@/components/SiteFooter"
import { SiteHeader } from "@/components/SiteHeader"

const upcomingSections = [
  { id: "stack", eyebrow: "Tools & practices", title: "Stack" },
  { id: "projects", eyebrow: "Selected work", title: "Projects" },
  { id: "experience", eyebrow: "Career", title: "Experience" },
  { id: "education", eyebrow: "Learning", title: "Education" },
  { id: "connect", eyebrow: "Elsewhere", title: "Connect" },
]

function App() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <HeroSection />
        {upcomingSections.map((section) => (
          <section className="page-section section-placeholder" id={section.id} key={section.id}>
            <div className="content-container">
              <SectionHeading eyebrow={section.eyebrow} title={section.title} />
            </div>
          </section>
        ))}
      </main>
      <SiteFooter />
    </div>
  )
}

export default App
