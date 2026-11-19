import { ArrowUpRight, ImageOff } from "lucide-react"
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react"
import { useState, type PointerEvent } from "react"

import { Spotlight } from "@/components/fx/Spotlight"
import { SectionHeading } from "@/components/sections/SectionHeading"
import { projects, type Project } from "@/data/portfolio"
import { cn, container } from "@/lib/utils"

const filters = [
  { value: "all", label: "All" },
  { value: "web", label: "Web" },
  { value: "ai", label: "AI & RL" },
] as const

type Filter = (typeof filters)[number]["value"]

function ProjectMedia({ project }: { project: Project }) {
  const [failed, setFailed] = useState<string[]>([])
  const images = project.images.filter((image) => !failed.includes(image.src))

  if (images.length === 0) {
    return (
      <div className="grid h-full place-items-center bg-gradient-to-br from-a1/20 via-transparent to-a2/20">
        <ImageOff aria-hidden="true" className="size-8 text-fg-faint" />
      </div>
    )
  }

  return (
    <div className={cn("grid h-full gap-px", images.length > 1 && "grid-cols-2")}>
      {images.map((image) => (
        <img
          alt={image.alt}
          className="h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.06]"
          key={image.src}
          loading="lazy"
          onError={() => setFailed((current) => [...current, image.src])}
          src={image.src}
        />
      ))}
    </div>
  )
}

function ProjectCard({ project, featured, index }: { project: Project; featured: boolean; index: number }) {
  const reduced = useReducedMotion()
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const rotateX = useSpring(useTransform(py, [0, 1], [6, -6]), { stiffness: 180, damping: 18 })
  const rotateY = useSpring(useTransform(px, [0, 1], [-6, 6]), { stiffness: 180, damping: 18 })

  const tilt = (event: PointerEvent<HTMLDivElement>) => {
    if (reduced || event.pointerType !== "mouse") return
    const rect = event.currentTarget.getBoundingClientRect()
    px.set((event.clientX - rect.left) / rect.width)
    py.set((event.clientY - rect.top) / rect.height)
  }
  const reset = () => {
    px.set(0.5)
    py.set(0.5)
  }

  const visibleTools = project.tools.slice(0, featured ? 8 : 5)
  const hiddenCount = project.tools.length - visibleTools.length

  return (
    <motion.li
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      className={cn("[perspective:1400px]", featured && "md:col-span-2")}
      exit={{ opacity: 0, scale: 0.94, filter: "blur(8px)" }}
      initial={{ opacity: 0, scale: 0.94, filter: "blur(8px)" }}
      layout
      transition={{ duration: 0.6, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div className="h-full" style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}>
        <Spotlight
          className={cn("group flex h-full flex-col overflow-hidden", featured && "lg:flex-row")}
          onPointerLeave={reset}
          onPointerMove={tilt}
        >
          <div
            className={cn(
              "relative m-2 mb-0 aspect-[16/10] overflow-hidden rounded-[1.1rem] border border-line bg-bg-elevated",
              featured && "lg:m-2 lg:aspect-auto lg:w-[58%] lg:shrink-0",
            )}
          >
            <ProjectMedia project={project} />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/70 via-transparent to-transparent" />
            <span className="glass absolute top-3 left-3 rounded-full px-3 py-1 font-mono text-[0.68rem] tracking-[0.18em] uppercase">
              {project.category === "ai" ? "AI · RL" : "Web"}
            </span>
          </div>

          <div className={cn("flex flex-1 flex-col p-6 md:p-7", featured && "lg:p-10")}>
            <div className="flex items-start justify-between gap-4">
              <h3
                className={cn(
                  "text-2xl font-semibold tracking-[-0.03em]",
                  featured && "lg:text-4xl lg:leading-[1.05]",
                )}
              >
                {project.name}
              </h3>
              {project.href ? (
                <a
                  aria-label={`${project.linkLabel ?? "Open"}: ${project.name}`}
                  className="grid size-11 shrink-0 place-items-center rounded-full border border-line-strong bg-surface transition-all duration-500 group-hover:rotate-45 group-hover:border-transparent group-hover:bg-fg group-hover:text-bg"
                  href={project.href}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  <ArrowUpRight aria-hidden="true" className="size-5" />
                </a>
              ) : null}
            </div>
            <p className={cn("mt-3 leading-relaxed text-fg-muted", featured && "lg:text-lg")}>
              {project.description}
            </p>
            <ul aria-label="Built with" className="mt-6 flex flex-wrap gap-2">
              {visibleTools.map((tool) => (
                <li className="chip" key={tool}>
                  {tool}
                </li>
              ))}
              {hiddenCount > 0 ? (
                <li className="chip" title={project.tools.slice(visibleTools.length).join(", ")}>
                  +{hiddenCount} more
                </li>
              ) : null}
            </ul>
            <div className="mt-auto pt-8">
              {project.href ? (
                <a
                  className="inline-flex items-center gap-2 text-sm font-medium text-fg underline-offset-4 hover:underline"
                  href={project.href}
                  rel="noreferrer noopener"
                  tabIndex={-1}
                  target="_blank"
                >
                  {project.linkLabel}
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </a>
              ) : (
                <span className="eyebrow">{project.note}</span>
              )}
            </div>
          </div>
        </Spotlight>
      </motion.div>
    </motion.li>
  )
}

export function Projects() {
  const [filter, setFilter] = useState<Filter>("all")
  const visible = projects.filter((project) => filter === "all" || project.category === filter)

  return (
    <section className="relative py-20 md:py-36" id="projects">
      <div className={container}>
        <SectionHeading
          description="Live products, experiments and university research."
          eyebrow="Selected work"
          index="02"
          title={
            <>
              Things I&apos;ve <span className="font-serif font-normal italic text-gradient">built</span>
            </>
          }
        />

        <LayoutGroup>
          <div aria-label="Filter projects" className="glass mb-10 inline-flex rounded-full p-1.5" role="group">
            {filters.map((item) => {
              const active = item.value === filter
              const count = projects.filter((p) => item.value === "all" || p.category === item.value).length
              return (
                <button
                  aria-pressed={active}
                  className={cn(
                    "relative rounded-full px-5 py-2.5 text-sm font-medium transition-colors",
                    active ? "text-bg" : "text-fg-muted hover:text-fg",
                  )}
                  key={item.value}
                  onClick={() => setFilter(item.value)}
                  type="button"
                >
                  {active ? (
                    <motion.span
                      className="absolute inset-0 rounded-full bg-fg"
                      layoutId="project-filter"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  ) : null}
                  <span className="relative">
                    {item.label}
                    <span className="ml-1.5 font-mono text-[0.7rem] opacity-60">{count}</span>
                  </span>
                </button>
              )
            })}
          </div>

          <p aria-live="polite" className="sr-only">
            Showing {visible.length} projects
          </p>

          <motion.ul className="grid gap-5 md:grid-cols-2" layout>
            <AnimatePresence mode="popLayout">
              {visible.map((project, index) => (
                <ProjectCard
                  featured={index === 0}
                  index={index}
                  key={project.name}
                  project={project}
                />
              ))}
            </AnimatePresence>
          </motion.ul>
        </LayoutGroup>
      </div>
    </section>
  )
}
