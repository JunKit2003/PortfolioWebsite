# Interactive Components and Icons

**Date:** 2026-11-09
**Status:** Approved design
**Builds on:** `2026-11-09-react-portfolio-design.md`

## Intent

Make the React portfolio feel alive and more legible by adding motion, iconography, and lightweight interactive controls, without adding a new UI runtime dependency.

## Goals

- Add scroll-reveal animations to sections and cards.
- Highlight the active section in the header navigation.
- Add interactive project cards and category filtering.
- Add a persisted dark/light theme toggle.
- Convert the experience list to an accordion.
- Add fact-only count-up statistics.
- Add UI/social icons, per-group stack icons, and brand logos where available.

## Non-goals

- Adding a new animation library or any new npm dependency.
- Introducing invented metrics, years-in-role, or achievements.
- Server-side rendering or backend services.
- Redesigning the established dark neutral palette or layout grid.

## Constraints

- Stay within the existing `frontend/` Vite React/TypeScript app.
- Reuse the installed `lucide-react` and `radix-ui` packages.
- Respect `prefers-reduced-motion`; all motion must be optional.
- Keep narrow viewports free of horizontal overflow.
- Preserve existing content, links, and the verified production build.

## Approach

Selected: native browser APIs plus installed primitives.

- `IntersectionObserver` and CSS handle reveal animations, active-section tracking, and count-up triggers.
- `radix-ui` provides accessible Tabs and Accordion primitives.
- `lucide-react` provides UI and social icons.
- The devicon CDN provides brand logos, with text fallback when an image fails.

Rejected: Framer Motion (extra runtime and bundle weight for effects CSS can achieve), and CSS-only reveal/nav (fragile without JS).

## Design

### Theme

- `:root` retains the current dark palette; a new `.light` block overrides the same CSS variables with a light palette.
- `ThemeToggle` (Sun/Moon icons) sits in the header. It toggles a `light` class on `<html>`, persists the choice in `localStorage`, and otherwise follows `prefers-color-scheme`.
- A small inline script in `frontend/index.html` applies the stored/system theme before first paint to avoid a flash.

### Icons

- Lucide: menu/close, sun/moon, external link, section and stack-group icons, accordion chevron.
- Social: Lucide GitHub/LinkedIn in the hero and Connect section; devicon brand marks where provided.
- Stack groups gain one representative icon each. Skill badges render a devicon brand icon when a slug is defined; unknown or failed loads fall back to label text only (`onError` hides the image).

### Scroll reveal

- `useReveal` observes elements marked `data-reveal` and adds `is-visible`.
- `[data-reveal]` starts translated/transparent and transitions in; a `--reveal-delay` custom property staggers card groups.
- Under `prefers-reduced-motion`, elements are visible immediately and transitions are disabled.

### Active navigation

- `useActiveSection(ids)` uses an IntersectionObserver to track the section nearest the top.
- `SiteHeader` marks the matching link with `is-active` and `aria-current="page"`.

### Projects

- `Project` gains a `category` field (`web` or `ai`).
- A Radix Tabs control filters the grid: All, Web, AI & RL.
- Cards lift on hover/focus-within and scale their image slightly; transitions are disabled under reduced motion.
- Missing images remain readable via the existing media background and alt text.

### Experience accordion

- Radix Accordion replaces the flat list. Trigger shows role, company, and period; content shows the bullet list. The current role is open by default. Chevron indicates state.

### Counters

- `StatStrip` derives values from data: projects, skill areas, roles, and degrees.
- `CountUp` animates from zero to the value the first time it scrolls into view using `requestAnimationFrame`; under reduced motion it renders the final value immediately.

## Components and files

Add:
- `frontend/src/components/ThemeToggle.tsx`
- `frontend/src/components/StatStrip.tsx`
- `frontend/src/components/CountUp.tsx`
- `frontend/src/components/ui/tabs.tsx`
- `frontend/src/components/ui/accordion.tsx`
- `frontend/src/hooks/useReveal.ts`
- `frontend/src/hooks/useActiveSection.ts`

Modify:
- `frontend/src/components/SiteHeader.tsx` (theme toggle, active nav)
- `frontend/src/App.tsx` (reveal hook, stat strip placement)
- `frontend/src/components/HeroSection.tsx` (icons, stat strip)
- `frontend/src/components/StackSection.tsx` (group/skill icons)
- `frontend/src/components/ProjectsSection.tsx` (tabs, card interactions)
- `frontend/src/components/ExperienceSection.tsx` (accordion)
- `frontend/src/components/ConnectSection.tsx` (brand icons)
- `frontend/src/data/portfolio.ts` (category and icon metadata)
- `frontend/src/index.css` (light theme, reveal, active nav, card interaction, tabs/accordion styling)
- `frontend/index.html` (pre-paint theme script)

## Accessibility

- Tabs and Accordion inherit Radix keyboard/focus behavior.
- Active nav uses `aria-current`; theme toggle exposes an accessible label and pressed state.
- Focus-visible styles remain on all interactive elements.
- Motion respects `prefers-reduced-motion`.
- Icon-only controls include `aria-label`; decorative icons use `aria-hidden`.

## Verification

- `npm run build` completes with no TypeScript errors.
- `npm run lint` reports no new errors beyond existing generated ShadCN warnings.
- `npm run preview`: theme toggle persists and survives reload; active nav updates; project filter works; accordion expands/collapses; counters reach final values.
- Narrow viewport check: no horizontal overflow with tabs, cards, and light theme.
- Reduced-motion check: content is immediately visible and transitions are suppressed.
