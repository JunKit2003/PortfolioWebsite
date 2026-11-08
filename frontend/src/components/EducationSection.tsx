import { SectionHeading } from "@/components/SectionHeading"
import { education } from "@/data/portfolio"

export function EducationSection() {
  return (
    <section className="page-section" id="education">
      <div className="content-container">
        <SectionHeading eyebrow="Learning" title="Education" />
        <ul className="education-list">
          {education.map((entry) => (
            <li className="education-item" key={entry.degree}>
              <h3>{entry.degree}</h3>
              <p className="education-meta">
                <span>{entry.institution}</span>
                <span aria-hidden="true"> · </span>
                <span>{entry.period}</span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
