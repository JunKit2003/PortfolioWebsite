import { ArrowDown } from "lucide-react"

import { StatStrip } from "@/components/StatStrip"
import { Button } from "@/components/ui/button"

const externalLinkProps = {
  rel: "noreferrer noopener",
  target: "_blank",
}

const githubIcon =
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg"
const linkedinIcon =
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg"

export function HeroSection() {
  return (
    <section className="hero-section" data-reveal id="about">
      <div className="content-container hero-content">
        <p className="eyebrow">Junior Software Engineer · The Access Group</p>
        <h1>Chee Jun Kit</h1>
        <p className="hero-summary">Computer Science (AI) graduate and full-stack developer.</p>
        <div className="hero-actions">
          <Button asChild size="lg">
            <a href="#projects">
              View projects
              <ArrowDown aria-hidden="true" />
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="https://github.com/JunKit2003" {...externalLinkProps}>
              <img alt="" aria-hidden="true" className="brand-icon" src={githubIcon} />
              GitHub
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="https://www.linkedin.com/in/cheejunkit/" {...externalLinkProps}>
              <img alt="" aria-hidden="true" className="brand-icon" src={linkedinIcon} />
              LinkedIn
            </a>
          </Button>
        </div>
        <StatStrip />
      </div>
    </section>
  )
}
