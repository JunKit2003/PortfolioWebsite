import { Button } from "@/components/ui/button"

const externalLinkProps = {
  rel: "noreferrer noopener",
  target: "_blank",
}

export function HeroSection() {
  return (
    <section className="hero-section" id="about">
      <div className="content-container hero-content">
        <p className="eyebrow">Junior Software Engineer · The Access Group</p>
        <h1>Chee Jun Kit</h1>
        <p className="hero-summary">Computer Science (AI) graduate and full-stack developer.</p>
        <div className="hero-actions">
          <Button asChild size="lg">
            <a href="#projects">View projects</a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="https://github.com/JunKit2003" {...externalLinkProps}>GitHub</a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="https://www.linkedin.com/in/cheejunkit/" {...externalLinkProps}>LinkedIn</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
