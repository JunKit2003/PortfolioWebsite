import { SectionHeading } from "@/components/SectionHeading"
import { experience } from "@/data/portfolio"

export function ExperienceSection() {
  return (
    <section className="page-section" id="experience">
      <div className="content-container">
        <SectionHeading eyebrow="Career" title="Experience" />
        <ol className="timeline">
          {experience.map((entry) => (
            <li className="timeline-item" key={`${entry.role}-${entry.period}`}>
              <div className="timeline-meta">
                <p className="timeline-period">{entry.period}</p>
              </div>
              <div className="timeline-body">
                <h3>{entry.role}</h3>
                <p className="timeline-company">{entry.company}</p>
                <ul className="timeline-bullets">
                  {entry.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
