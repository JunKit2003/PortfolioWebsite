import { ArrowDownRight } from "lucide-react"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import { useRef } from "react"

import { Magnetic } from "@/components/fx/Magnetic"
import { ParticleField } from "@/components/fx/ParticleField"
import { CountUp } from "@/components/fx/Reveal"
import { RotatingWords } from "@/components/fx/RotatingWords"
import { SplitText } from "@/components/fx/SplitText"
import { container } from "@/lib/utils"
import { BrandIcon } from "@/components/sections/BrandIcon"
import { education, experience, projects, skillGroups, socialLinks } from "@/data/portfolio"

const builds = [
  "React frontends.",
  "ASP.NET services.",
  "Azure platforms.",
  "AI workflows.",
  "RL agents.",
]

const stats = [
  { label: "Projects", value: projects.length },
  { label: "Skill areas", value: skillGroups.length },
  { label: "Roles", value: experience.length },
  { label: "Degrees", value: education.length },
]

const ease = [0.16, 1, 0.3, 1] as const

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "28%"])
  const contentScale = useTransform(scrollYProgress, [0, 1], [1, 0.92])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0])

  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden"
      id="about"
      ref={ref}
    >
      <div aria-hidden="true" className="aurora">
        <span />
        <span />
        <span />
      </div>
      <div aria-hidden="true" className="grid-backdrop" />
      <ParticleField className="absolute inset-0 h-full w-full" />

      <motion.div
        className={`${container} relative z-10 flex flex-1 flex-col justify-center pt-28 pb-12`}
        style={reduced ? undefined : { y: contentY, scale: contentScale, opacity: contentOpacity }}
      >
        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className="glass mb-8 inline-flex w-fit items-center gap-3 rounded-full px-4 py-2 text-xs text-fg-muted sm:text-sm"
          initial={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.8, ease }}
        >
          <span className="pulse-dot" />
          <span>
            Junior Software Engineer at <span className="font-medium text-fg">The Access Group</span>
          </span>
        </motion.p>

        <h1
          className="text-[clamp(3.4rem,12vw,10rem)] font-semibold leading-[0.86] tracking-[-0.06em]"
          id="hero-title"
        >
          <SplitText delay={0.15} text="Chee" />
          <br />
          <SplitText className="font-serif font-normal italic tracking-[-0.03em]" delay={0.35} text="Jun Kit" />
        </h1>

        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 max-w-3xl text-[clamp(1.4rem,3.2vw,2.4rem)] leading-[1.15] tracking-[-0.03em] text-fg-muted"
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.9, duration: 0.9, ease }}
        >
          Full-stack engineer and CS (AI) graduate.
          <br />
          I build <RotatingWords words={builds} />
        </motion.p>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-10 flex flex-wrap items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 1.1, duration: 0.9, ease }}
        >
          <Magnetic>
            <a className="shimmer-btn inline-flex" href="#projects">
              <span>
                See the work
                <ArrowDownRight aria-hidden="true" className="size-4" />
              </span>
            </a>
          </Magnetic>
          {socialLinks.map((link) => (
            <Magnetic key={link.label}>
              <a className="ghost-btn" href={link.href} rel="noreferrer noopener" target="_blank">
                <BrandIcon className="size-4" slug={link.iconSlug} />
                {link.label}
              </a>
            </Magnetic>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        animate={{ opacity: 1 }}
        className={`${container} relative z-10 pb-10`}
        initial={{ opacity: 0 }}
        transition={{ delay: 1.4, duration: 1 }}
      >
        <div className="flex items-end justify-between gap-8 border-t border-line pt-8">
          <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
            {stats.map((stat) => (
              <div className="flex flex-col-reverse gap-1" key={stat.label}>
                <dt className="eyebrow">{stat.label}</dt>
                <dd className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                  <CountUp value={stat.value} />
                </dd>
              </div>
            ))}
          </dl>
          <a aria-label="Scroll to stack" className="hidden shrink-0 md:block" href="#stack">
            <span className="scroll-cue" />
          </a>
        </div>
      </motion.div>
    </section>
  )
}
