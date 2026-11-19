import { Reveal } from "@/components/fx/Reveal"
import { Spotlight } from "@/components/fx/Spotlight"
import { BrandIcon } from "@/components/sections/BrandIcon"
import { SectionHeading } from "@/components/sections/SectionHeading"
import { TechMarquee } from "@/components/sections/TechMarquee"
import { skillGroups, skillIconSlugs } from "@/data/portfolio"
import { cn, container } from "@/lib/utils"

// Bento spans on a 12-column grid; each row adds up to 12.
const spans = [
  "lg:col-span-7",
  "lg:col-span-5",
  "lg:col-span-4",
  "lg:col-span-8",
  "lg:col-span-5",
  "lg:col-span-7",
  "lg:col-span-4",
  "lg:col-span-8",
]

export function Stack() {
  return (
    <section className="relative py-20 md:py-36" id="stack">
      <div className={container}>
        <SectionHeading
          description="The frameworks, platforms and practices I use to build and run software day to day."
          eyebrow="Tools & practices"
          index="01"
          title={
            <>
              The <span className="font-serif font-normal italic text-gradient">stack</span>
            </>
          }
        />
      </div>

      <TechMarquee />

      <div className={cn(container, "mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-12")}>
        {skillGroups.map((group, index) => {
          const Icon = group.icon
          return (
            <Reveal className={cn("h-full", spans[index])} delay={(index % 2) * 0.08} key={group.title}>
              <Spotlight className="group flex h-full flex-col overflow-hidden p-7 md:p-8">
                <span
                  aria-hidden="true"
                  className="text-outline pointer-events-none absolute -top-6 right-4 font-serif text-[9rem] leading-none italic select-none"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="relative mb-8 grid size-12 place-items-center rounded-2xl border border-line-strong bg-gradient-to-br from-a1/25 to-a2/10 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
                  <Icon aria-hidden="true" className="size-5 text-fg" />
                </span>
                <h3 className="text-2xl font-semibold tracking-[-0.03em]">{group.title}</h3>
                <p className="mt-2 mb-8 text-fg-muted">{group.description}</p>
                <ul className="mt-auto flex flex-wrap gap-2">
                  {group.skills.map((skill) => {
                    const slug = skillIconSlugs[skill]
                    return (
                      <li className="chip" key={skill}>
                        {slug ? <BrandIcon slug={slug} /> : null}
                        {skill}
                      </li>
                    )
                  })}
                </ul>
              </Spotlight>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
