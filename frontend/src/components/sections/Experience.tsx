import { GraduationCap } from "lucide-react"
import { motion, useScroll, useSpring } from "motion/react"
import { useRef } from "react"

import { Reveal } from "@/components/fx/Reveal"
import { Spotlight } from "@/components/fx/Spotlight"
import { SectionHeading } from "@/components/sections/SectionHeading"
import { education, experience } from "@/data/portfolio"
import { cn, container } from "@/lib/utils"

function Timeline() {
  const ref = useRef<HTMLOListElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] })
  const beam = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 })

  return (
    <ol className="relative" ref={ref}>
      <span aria-hidden="true" className="absolute top-2 bottom-2 left-[7px] w-px bg-line md:left-[calc(11rem+7px)]" />
      <motion.span
        aria-hidden="true"
        className="absolute top-2 bottom-2 left-[7px] w-px origin-top bg-gradient-to-b from-a2 via-a1 to-a3 shadow-[0_0_14px_var(--a1)] md:left-[calc(11rem+7px)]"
        style={{ scaleY: beam }}
      />
      {experience.map((entry, index) => {
        const current = entry.period.includes("Present")
        return (
          <li className="relative pb-16 pl-10 last:pb-0 md:grid md:grid-cols-[11rem_1fr] md:pl-0" key={`${entry.role}-${entry.period}`}>
            <Reveal className="mb-3 md:mb-0 md:pt-1 md:pr-10 md:text-right" delay={0.05}>
              <p className="eyebrow leading-relaxed">{entry.period.replace(" - ", " — ")}</p>
            </Reveal>
            <span
              aria-hidden="true"
              className={cn(
                "absolute top-1.5 left-0 grid size-[15px] place-items-center rounded-full border border-line-strong bg-bg md:left-[11rem]",
                current && "border-a2",
              )}
            >
              <span className={cn("size-[5px] rounded-full bg-fg-faint", current && "pulse-dot size-[7px] bg-a2")} />
            </span>
            <Reveal className="md:pl-12" delay={0.1 + index * 0.02}>
              <h3 className="text-[clamp(1.6rem,3.4vw,2.6rem)] font-semibold leading-[1.05] tracking-[-0.035em]">
                {entry.role}
              </h3>
              <p className="mt-1 font-serif text-2xl italic text-fg-muted">{entry.company}</p>
              <ul className="mt-5 max-w-2xl space-y-3 text-fg-muted">
                {entry.bullets.map((bullet) => (
                  <li className="flex gap-3 leading-relaxed" key={bullet}>
                    <span aria-hidden="true" className="mt-[0.7em] h-px w-4 shrink-0 bg-a1" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </Reveal>
          </li>
        )
      })}
    </ol>
  )
}

export function Experience() {
  return (
    <section className="relative py-20 md:py-36" id="experience">
      <div className={container}>
        <SectionHeading
          eyebrow="Career"
          index="03"
          title={
            <>
              Where I&apos;ve <span className="font-serif font-normal italic text-gradient">worked</span>
            </>
          }
        />
        <Timeline />
      </div>
    </section>
  )
}

export function Education() {
  return (
    <section className="relative py-20 md:py-36" id="education">
      <div className={container}>
        <SectionHeading
          eyebrow="Learning"
          index="04"
          title={
            <>
              Where I <span className="font-serif font-normal italic text-gradient">studied</span>
            </>
          }
        />
        <ul className="grid gap-5 md:grid-cols-2">
          {education.map((entry, index) => (
            <Reveal as="li" className="h-full" delay={index * 0.1} key={entry.degree}>
                <Spotlight className="group flex h-full flex-col justify-between gap-16 p-8 md:p-10">
                  <div className="flex items-center justify-between">
                    <span className="grid size-12 place-items-center rounded-2xl border border-line-strong bg-gradient-to-br from-a3/25 to-a1/10 transition-transform duration-500 group-hover:rotate-6">
                      <GraduationCap aria-hidden="true" className="size-5" />
                    </span>
                    <span className="eyebrow">{entry.period}</span>
                  </div>
                  <div>
                    <h3 className="font-serif text-[clamp(2rem,4vw,3.2rem)] leading-[1] tracking-[-0.02em]">
                      {entry.degree}
                    </h3>
                    <p className="mt-4 text-fg-muted">{entry.institution}</p>
                  </div>
                </Spotlight>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
