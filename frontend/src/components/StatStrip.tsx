import { CountUp } from "@/components/CountUp"
import { education, experience, projects, skillGroups } from "@/data/portfolio"

const stats = [
  { label: "Projects", value: projects.length },
  { label: "Skill areas", value: skillGroups.length },
  { label: "Roles", value: experience.length },
  { label: "Degrees", value: education.length },
]

export function StatStrip() {
  return (
    <dl className="stat-strip">
      {stats.map((stat) => (
        <div className="stat" key={stat.label}>
          <dt>{stat.label}</dt>
          <dd>
            <CountUp value={stat.value} />
          </dd>
        </div>
      ))}
    </dl>
  )
}
