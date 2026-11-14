import { SectionHeading } from "@/components/SectionHeading"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { experience } from "@/data/portfolio"

export function ExperienceSection() {
  return (
    <section className="page-section" data-reveal id="experience">
      <div className="content-container">
        <SectionHeading eyebrow="Career" title="Experience" />
        <Accordion
          className="experience-accordion"
          collapsible
          defaultValue="experience-0"
          type="single"
        >
          {experience.map((entry, index) => (
            <AccordionItem key={`${entry.role}-${entry.period}`} value={`experience-${index}`}>
              <AccordionTrigger>
                <span className="experience-trigger">
                  <span className="experience-role">{entry.role}</span>
                  <span className="experience-company">{entry.company}</span>
                  <span className="experience-period">{entry.period}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="timeline-bullets">
                  {entry.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
