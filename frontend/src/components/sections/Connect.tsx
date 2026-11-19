import { ArrowUp, ArrowUpRight } from "lucide-react"

import { Magnetic } from "@/components/fx/Magnetic"
import { Reveal } from "@/components/fx/Reveal"
import { BrandIcon } from "@/components/sections/BrandIcon"
import { ContactForm } from "@/components/sections/ContactForm"
import { VisitCounter } from "@/components/VisitCounter"
import { socialLinks } from "@/data/portfolio"
import { container } from "@/lib/utils"

const year = new Date().getFullYear()

export function Connect() {
  return (
    <div className="relative isolate overflow-hidden">
    <section className="pt-20 md:pt-36" id="connect">
      <div aria-hidden="true" className="aurora -z-10 opacity-70 [mask-image:linear-gradient(to_top,black_30%,transparent)]">
        <span />
        <span />
        <span />
      </div>
      <div className={container}>
        <Reveal>
          <p className="eyebrow mb-8 flex items-center gap-3">
            <span className="text-a2">05</span>
            <span className="h-px w-10 bg-line-strong" />
            Elsewhere
          </p>
          <h2 className="text-[clamp(3.2rem,11vw,10rem)] font-semibold leading-[0.88] tracking-[-0.06em]">
            Let&apos;s build
            <br />
            <span className="font-serif font-normal italic text-gradient">something.</span>
          </h2>
          <p className="mt-8 max-w-xl text-lg text-fg-muted">
            Send me a message, or find my code on GitHub and my experience on LinkedIn.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <ContactForm />
        </Reveal>

        <ul className="mt-16 border-t border-line">
          {socialLinks.map((link, index) => (
            <Reveal as="li" className="border-b border-line" delay={index * 0.08} key={link.label}>
                <a
                  className="group relative flex items-center justify-between gap-6 overflow-hidden py-8 md:py-10"
                  href={link.href}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 -z-10 origin-bottom scale-y-0 bg-gradient-to-r from-a1/15 via-a3/10 to-a2/15 transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-y-100"
                  />
                  <span className="flex items-center gap-5 transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-4">
                    <BrandIcon className="size-9 md:size-12" slug={link.iconSlug} />
                    <span>
                      <span className="block text-[clamp(2rem,6vw,4.5rem)] font-semibold leading-none tracking-[-0.045em]">
                        {link.label}
                      </span>
                      <span className="mt-2 block text-fg-muted">{link.description}</span>
                    </span>
                  </span>
                  <span className="grid size-14 shrink-0 place-items-center rounded-full border border-line-strong transition-all duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:rotate-45 group-hover:bg-fg group-hover:text-bg md:size-20">
                    <ArrowUpRight aria-hidden="true" className="size-6 md:size-8" />
                  </span>
                </a>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>

      <footer className={`${container} relative pt-24 pb-8`}>
        <p
          aria-hidden="true"
          className="text-outline pointer-events-none text-center text-[clamp(3rem,15.5vw,15rem)] leading-[0.8] font-semibold tracking-[-0.07em] whitespace-nowrap select-none"
        >
          Chee Jun Kit
        </p>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 text-sm text-fg-faint sm:flex-row">
          <p>© {year} Chee Jun Kit</p>
          <VisitCounter className="font-mono text-xs tracking-wider" />
          <p className="font-mono text-xs tracking-wider">Built with React, Motion &amp; Tailwind</p>
          <Magnetic>
            <a className="ghost-btn !px-4 !py-2.5 text-sm" href="#about">
              Back to top
              <ArrowUp aria-hidden="true" className="size-4" />
            </a>
          </Magnetic>
        </div>
      </footer>
    </div>
  )
}
