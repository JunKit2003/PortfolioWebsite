import { SectionHeading } from "@/components/SectionHeading"
import { Button } from "@/components/ui/button"
import { socialLinks } from "@/data/portfolio"

const externalLinkProps = {
  rel: "noreferrer noopener",
  target: "_blank",
}

export function ConnectSection() {
  return (
    <section className="page-section" id="connect">
      <div className="content-container">
        <SectionHeading
          eyebrow="Elsewhere"
          title="Connect"
          description="Find me on GitHub and LinkedIn."
        />
        <div className="connect-grid">
          {socialLinks.map((link) => (
            <div className="connect-card" key={link.label}>
              <div>
                <h3>{link.label}</h3>
                <p>{link.description}</p>
              </div>
              <Button asChild variant="outline">
                <a href={link.href} {...externalLinkProps}>
                  Open {link.label}
                </a>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
