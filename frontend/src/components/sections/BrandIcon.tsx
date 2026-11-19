import { cn } from "@/lib/utils"

function deviconUrl(slug: string) {
  return `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${slug}/${slug}-original.svg`
}

// Monochrome marks that disappear on dark backgrounds get inverted there.
const invertOnDark = new Set(["github", "nextjs", "vercel"])

/** Decorative brand logo from devicon; hides itself if the CDN is unreachable. */
export function BrandIcon({ slug, className }: { slug: string; className?: string }) {
  return (
    <img
      alt=""
      aria-hidden="true"
      className={cn(invertOnDark.has(slug) && "invert light:invert-0", className)}
      loading="lazy"
      onError={(event) => {
        event.currentTarget.style.display = "none"
      }}
      src={deviconUrl(slug)}
    />
  )
}
