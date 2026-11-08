import { ExternalLink } from "lucide-react"

import { SectionHeading } from "@/components/SectionHeading"
import { Button } from "@/components/ui/button"
import { socialLinks } from "@/data/portfolio"

const externalLinkProps = {
  rel: "noreferrer noopener",
  target: "_blank",
}

function deviconUrl(slug: string) {
  return `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${slug}/${slug}-original.svg`
}

export function ConnectSection() {
  return (
    <section className="page-section" data-reveal id="connect">
      <div className="content-container">
        <SectionHeading
          eyebrow="Elsewhere"
          title="Connect"
          description="Find me on GitHub and LinkedIn."
        />
        <div className="connect-grid">
          {socialLinks.map((link) => (
            <div className="connect-card" key={link.label}>
              <div className="connect-copy">
                <img
                  alt=""
                  aria-hidden="true"
                  className="brand-icon brand-icon-lg"
                  loading="lazy"
                  src={deviconUrl(link.iconSlug)}
                />
                <div>
                  <h3>{link.label}</h3>
                  <p>{link.description}</p>
                </div>
              </div>
              <Button asChild variant="outline">
                <a href={link.href} {...externalLinkProps}>
                  Open {link.label}
                  <ExternalLink aria-hidden="true" />
                </a>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
