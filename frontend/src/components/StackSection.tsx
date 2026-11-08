import { SectionHeading } from "@/components/SectionHeading"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { skillGroups } from "@/data/portfolio"

export function StackSection() {
  return (
    <section className="page-section" id="stack">
      <div className="content-container">
        <SectionHeading
          eyebrow="Tools & practices"
          title="Stack"
          description="The frameworks, platforms, and practices I use to build and run software day to day."
        />
        <div className="stack-grid">
          {skillGroups.map((group) => (
            <Card className="stack-card" key={group.title}>
              <CardHeader>
                <CardTitle>{group.title}</CardTitle>
                <CardDescription>{group.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="badge-list">
                  {group.skills.map((skill) => (
                    <li key={skill}>
                      <Badge variant="secondary">{skill}</Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
