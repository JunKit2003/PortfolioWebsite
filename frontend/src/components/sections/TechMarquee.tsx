import { Marquee } from "@/components/fx/Marquee"
import { BrandIcon } from "@/components/sections/BrandIcon"
import { skillGroups, skillIconSlugs } from "@/data/portfolio"

const allSkills = skillGroups.flatMap((group) => group.skills)
const half = Math.ceil(allSkills.length / 2)
// Repeat each row so one track is always wider than the widest screen (no gap on loop).
const rows = [allSkills.slice(0, half), allSkills.slice(half)].map((row) => [...row, ...row])

export function TechMarquee() {
  return (
    <div className="relative flex flex-col gap-4 border-y border-line py-10">
      {rows.map((row, index) => (
        <Marquee duration={index === 0 ? 90 : 105} key={index} reverse={index === 1}>
          {row.map((skill, skillIndex) => {
            const slug = skillIconSlugs[skill]
            return (
              <span
                className="flex items-center gap-3 rounded-full border border-line bg-surface px-5 py-2.5 text-lg font-medium tracking-tight whitespace-nowrap text-fg-muted"
                key={`${skill}-${skillIndex}`}
              >
                {slug ? (
                  <BrandIcon className="size-5" slug={slug} />
                ) : (
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-a1" />
                )}
                {skill}
              </span>
            )
          })}
        </Marquee>
      ))}
    </div>
  )
}
