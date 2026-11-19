import type { HTMLAttributes, PointerEvent } from "react"

import { cn } from "@/lib/utils"

/** Card whose border and fill light up under the cursor (see `.spotlight` in index.css). */
export function Spotlight({ className, onPointerMove, ...props }: HTMLAttributes<HTMLDivElement>) {
  const track = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    event.currentTarget.style.setProperty("--x", `${event.clientX - rect.left}px`)
    event.currentTarget.style.setProperty("--y", `${event.clientY - rect.top}px`)
    onPointerMove?.(event)
  }

  return <div className={cn("spotlight", className)} onPointerMove={track} {...props} />
}
