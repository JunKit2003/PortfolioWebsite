import { SectionHeading } from "@/components/SectionHeading"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { skillGroups, skillIconSlugs } from "@/data/portfolio"

function deviconUrl(slug: string) {
  return `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${slug}/${slug}-original.svg`
}

export function StackSection() {
  return (
    <section className="page-section" data-reveal id="stack">
      <div className="content-container">
        <SectionHeading
          eyebrow="Tools & practices"
          title="Stack"
          description="The frameworks, platforms, and practices I use to build and run software day to day."
        />
        <div className="stack-grid">
          {skillGroups.map((group) => {
            const GroupIcon = group.icon
            return (
              <Card className="stack-card" key={group.title}>
                <CardHeader>
                  <CardTitle>
                    <GroupIcon aria-hidden="true" className="stack-group-icon" />
                    {group.title}
                  </CardTitle>
                  <CardDescription>{group.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="badge-list">
                    {group.skills.map((skill) => {
                      const slug = skillIconSlugs[skill]
                      return (
                        <li key={skill}>
                          <Badge className="skill-badge" variant="secondary">
                            {slug ? (
                              <img
                                alt=""
                                aria-hidden="true"
                                className="skill-icon"
                                loading="lazy"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none"
                                }}
                                src={deviconUrl(slug)}
                              />
                            ) : null}
                            {skill}
                          </Badge>
                        </li>
                      )
                    })}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
