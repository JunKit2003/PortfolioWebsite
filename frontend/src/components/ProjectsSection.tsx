import { SectionHeading } from "@/components/SectionHeading"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { projects } from "@/data/portfolio"

const externalLinkProps = {
  rel: "noreferrer noopener",
  target: "_blank",
}

export function ProjectsSection() {
  return (
    <section className="page-section" data-reveal id="projects">
      <div className="content-container">
        <SectionHeading
          eyebrow="Selected work"
          title="Projects"
          description="A mix of product work, experiments, and research projects."
        />
        <div className="projects-grid">
          {projects.map((project) => {
            const isPaired = project.images.length > 1

            return (
              <Card className="project-card" key={project.name}>
                <div
                  className={
                    isPaired ? "project-media project-media-paired" : "project-media"
                  }
                >
                  {project.images.map((image) => (
                    <img
                      alt={image.alt}
                      key={image.src}
                      loading="lazy"
                      src={image.src}
                    />
                  ))}
                </div>
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription className="project-tools">
                    {project.tools.join(" · ")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="project-description">{project.description}</p>
                </CardContent>
                <CardFooter className="project-footer">
                  {project.href ? (
                    <Button asChild size="sm" variant="outline">
                      <a href={project.href} {...externalLinkProps}>
                        {project.linkLabel}
                      </a>
                    </Button>
                  ) : (
                    <span className="project-note">{project.note}</span>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
