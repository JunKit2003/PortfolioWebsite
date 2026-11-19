import type { ReactNode } from "react"

import { Reveal } from "@/components/fx/Reveal"

type SectionHeadingProps = {
  index: string
  eyebrow: string
  title: ReactNode
  description?: string
}

export function SectionHeading({ index, eyebrow, title, description }: SectionHeadingProps) {
  return (
    <Reveal className="mb-14 grid gap-6 md:mb-20 md:grid-cols-[1fr_auto] md:items-end">
      <div>
        <p className="eyebrow mb-5 flex items-center gap-3">
          <span className="text-a2">{index}</span>
          <span className="h-px w-10 bg-line-strong" />
          {eyebrow}
        </p>
        <h2 className="text-[clamp(2.6rem,7vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.045em]">
          {title}
        </h2>
      </div>
      {description ? (
        <p className="max-w-sm text-base leading-relaxed text-fg-muted md:text-right">{description}</p>
      ) : null}
    </Reveal>
  )
}

