# Interactive Components and Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persisted theme toggle, iconography, scroll reveal, active-section navigation, project filtering, card interactions, an experience accordion, and count-up stats to the existing React portfolio.

**Architecture:** Work inside the existing Vite React/TypeScript app under `frontend/`. Use native `IntersectionObserver` and CSS for reveal/active-nav/counters, the already-installed `radix-ui` package for accessible Tabs and Accordion, `lucide-react` for UI icons, and the devicon CDN for brand marks with text fallback.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, ShadCN-style components, Radix UI, Lucide React.

**Working directory:** `.worktree/portfolio-react-worktree` (branch `feat/react-typescript-portfolio`).

**Spec:** `docs/superpowers/specs/2026-11-09-interactive-components-icons-design.md`

## Global Constraints

- Do not add any new npm dependency; only `lucide-react` and `radix-ui` are used.
- All motion must respect `prefers-reduced-motion`.
- No horizontal overflow at narrow viewports.
- Do not introduce invented metrics or achievements; counters derive from existing data arrays only.
- Preserve existing content, links, and the verified production build.
- Do not commit unless the user explicitly asks.

---

### Task 1: Theme system

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `frontend/index.html`
- Create: `frontend/src/components/ThemeToggle.tsx`
- Modify: `frontend/src/components/SiteHeader.tsx`

**Interfaces:**
- Produces: `ThemeToggle(): JSX.Element`, toggles the `light` class on `<html>` and persists `localStorage["theme"]` as `"light"` or `"dark"`.

- [ ] **Step 1: Add the light palette and color-scheme rules to `frontend/src/index.css`**

Insert immediately after the closing `}` of the existing `:root` block (after `--radius: 0.625rem;` and its closing brace):

```css
html {
  color-scheme: dark;
}

html.light {
  color-scheme: light;
}

.light {
  --background: oklch(0.98 0.004 260);
  --foreground: oklch(0.18 0.012 260);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.18 0.012 260);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.18 0.012 260);
  --primary: oklch(0.55 0.16 255);
  --primary-foreground: oklch(0.99 0.002 260);
  --secondary: oklch(0.95 0.006 260);
  --secondary-foreground: oklch(0.22 0.012 260);
  --muted: oklch(0.95 0.006 260);
  --muted-foreground: oklch(0.5 0.015 260);
  --accent: oklch(0.92 0.015 255);
  --accent-foreground: oklch(0.22 0.012 260);
  --destructive: oklch(0.58 0.2 25);
  --border: oklch(0.88 0.008 260);
  --input: oklch(0.88 0.008 260);
  --ring: oklch(0.6 0.14 255);
}
```

- [ ] **Step 2: Add the pre-paint theme script to `frontend/index.html`**

Add inside `<head>`, after the `<title>` line:

```html
    <script>
      (function () {
        try {
          var stored = localStorage.getItem("theme")
          var prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches
          if (stored === "light" || (!stored && prefersLight)) {
            document.documentElement.classList.add("light")
          }
        } catch (error) {}
      })()
    </script>
```

- [ ] **Step 3: Create `frontend/src/components/ThemeToggle.tsx`**

```tsx
import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"

type Theme = "dark" | "light"

function getInitialTheme(): Theme {
  if (typeof document === "undefined") return "dark"
  return document.documentElement.classList.contains("light") ? "light" : "dark"
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const isLight = theme === "light"

  useEffect(() => {
    document.documentElement.classList.toggle("light", isLight)
    try {
      localStorage.setItem("theme", theme)
    } catch (error) {}
  }, [isLight, theme])

  return (
    <Button
      aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
      aria-pressed={isLight}
      onClick={() => setTheme(isLight ? "dark" : "light")}
      size="icon"
      type="button"
      variant="ghost"
    >
      {isLight ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
    </Button>
  )
}
```

- [ ] **Step 4: Replace `frontend/src/components/SiteHeader.tsx`**

```tsx
import { useEffect, useState } from "react"
import { Menu, X } from "lucide-react"

import { ThemeToggle } from "@/components/ThemeToggle"
import { Button } from "@/components/ui/button"
import { useActiveSection } from "@/hooks/useActiveSection"

const navigationItems = [
  { href: "#about", label: "About" },
  { href: "#stack", label: "Stack" },
  { href: "#projects", label: "Projects" },
  { href: "#experience", label: "Experience" },
  { href: "#education", label: "Education" },
  { href: "#connect", label: "Connect" },
]

const sectionIds = navigationItems.map((item) => item.href.slice(1))

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const activeSection = useActiveSection(sectionIds)

  useEffect(() => {
    if (!isMenuOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false)
    }

    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [isMenuOpen])

  return (
    <header className="site-header">
      <nav className="content-container site-nav" aria-label="Primary navigation">
        <a className="site-brand" href="#about" onClick={() => setIsMenuOpen(false)}>
          Chee Jun Kit
        </a>
        <div className={isMenuOpen ? "site-nav-links is-open" : "site-nav-links"} id="primary-navigation">
          {navigationItems.map((item) => {
            const isActive = activeSection === item.href.slice(1)
            return (
              <a
                aria-current={isActive ? "page" : undefined}
                className={isActive ? "is-active" : undefined}
                href={item.href}
                key={item.href}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </a>
            )
          })}
        </div>
        <div className="site-nav-actions">
          <ThemeToggle />
          <Button
            aria-controls="primary-navigation"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
            className="site-nav-toggle"
            onClick={() => setIsMenuOpen((open) => !open)}
            size="icon"
            type="button"
            variant="ghost"
          >
            {isMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </Button>
        </div>
      </nav>
    </header>
  )
}
```

Note: this imports `useActiveSection`, which is created in Task 3. Create the hook file before running the build in this task, or run the build only after Task 3. If executing tasks strictly in order, temporarily create `frontend/src/hooks/useActiveSection.ts` with the Task 3 content as part of this step.

- [ ] **Step 5: Add header layout styles to `frontend/src/index.css`**

Append with the other layout styles:

```css
.site-nav-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.site-nav-links a.is-active {
  background: var(--accent);
  color: var(--foreground);
}
```

- [ ] **Step 6: Verify**

Run: `cd frontend && npm run build`
Expected: TypeScript and Vite complete with no errors.

---

### Task 2: Icons across stack, hero, and connect

**Files:**
- Modify: `frontend/src/data/portfolio.ts`
- Modify: `frontend/src/components/StackSection.tsx`
- Modify: `frontend/src/components/HeroSection.tsx`
- Modify: `frontend/src/components/ConnectSection.tsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Consumes: existing `skillGroups`, `socialLinks`.
- Produces: `SkillGroup.icon: LucideIcon`; exported `skillIconSlugs: Record<string, string>`; `SocialLink.iconSlug: string`.

- [ ] **Step 1: Update `frontend/src/data/portfolio.ts`**

Add imports at the top:

```ts
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  BrainCircuit,
  Cloud,
  Database,
  GitBranch,
  Layers,
  MonitorSmartphone,
  Server,
} from "lucide-react"
```

Change the `SkillGroup` type to:

```ts
export type SkillGroup = {
  title: string
  description: string
  icon: LucideIcon
  skills: string[]
}
```

Change the `SocialLink` type to:

```ts
export type SocialLink = {
  label: string
  href: string
  description: string
  iconSlug: string
}
```

Add an `icon` property to each `skillGroups` entry, in order:

```ts
icon: MonitorSmartphone, // Frontend
icon: Server,           // Backend
icon: Database,         // Data
icon: Cloud,            // Cloud & Infrastructure
icon: GitBranch,        // Source Control & Delivery
icon: BrainCircuit,     // AI & Developer Tools
icon: Activity,         // Observability
icon: Layers,           // Architecture & Extensibility
```

Add `iconSlug: "github"` and `iconSlug: "linkedin"` to the two `socialLinks` entries respectively.

Append this export at the end of the file:

```ts
export const skillIconSlugs: Record<string, string> = {
  React: "react",
  TypeScript: "typescript",
  "Tailwind CSS": "tailwindcss",
  HTML: "html5",
  CSS: "css3",
  "ASP.NET": "dotnetcore",
  "C#": "csharp",
  "Node.js": "nodejs",
  MSSQL: "microsoftsqlserver",
  PostgreSQL: "postgresql",
  "Sequelize ORM": "sequelize",
  "Azure Static Web Apps": "azure",
  "Azure Container Apps": "azure",
  "Azure Front Door": "azure",
  "Azure CLI": "azure",
  "Azure MCP": "azure",
  Docker: "docker",
  Kubernetes: "kubernetes",
  Nginx: "nginx",
  Git: "git",
  "Azure DevOps Boards": "azuredevops",
  "Azure DevOps Tickets": "azuredevops",
  "Azure DevOps CI/CD": "azuredevops",
  "Ubuntu / WSL": "ubuntu",
  "New Relic": "newrelic",
}
```

- [ ] **Step 2: Replace `frontend/src/components/StackSection.tsx`**

```tsx
import { SectionHeading } from "@/components/SectionHeading"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { skillGroups, skillIconSlugs } from "@/data/portfolio"

function deviconUrl(slug: string) {
  return `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${slug}/${slug}-original.svg`
}

export function StackSection() {
  return (
    <section className="page-section" data-reveal id="stack">
      <div className="content-container">
        <SectionHeading
          eyebrow="Tools & practices"
          title="Stack"
          description="The frameworks, platforms, and practices I use to build and run software day to day."
        />
        <div className="stack-grid">
          {skillGroups.map((group) => {
            const GroupIcon = group.icon
            return (
              <Card className="stack-card" key={group.title}>
                <CardHeader>
                  <CardTitle>
                    <GroupIcon aria-hidden="true" className="stack-group-icon" />
                    {group.title}
                  </CardTitle>
                  <CardDescription>{group.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="badge-list">
                    {group.skills.map((skill) => {
                      const slug = skillIconSlugs[skill]
                      return (
                        <li key={skill}>
                          <Badge className="skill-badge" variant="secondary">
                            {slug ? (
                              <img
                                alt=""
                                aria-hidden="true"
                                className="skill-icon"
                                loading="lazy"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none"
                                }}
                                src={deviconUrl(slug)}
                              />
                            ) : null}
                            {skill}
                          </Badge>
                        </li>
                      )
                    })}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Replace `frontend/src/components/HeroSection.tsx`**

```tsx
import { ArrowDown } from "lucide-react"

import { StatStrip } from "@/components/StatStrip"
import { Button } from "@/components/ui/button"

const externalLinkProps = {
  rel: "noreferrer noopener",
  target: "_blank",
}

const githubIcon =
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg"
const linkedinIcon =
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg"

export function HeroSection() {
  return (
    <section className="hero-section" data-reveal id="about">
      <div className="content-container hero-content">
        <p className="eyebrow">Junior Software Engineer · The Access Group</p>
        <h1>Chee Jun Kit</h1>
        <p className="hero-summary">Computer Science (AI) graduate and full-stack developer.</p>
        <div className="hero-actions">
          <Button asChild size="lg">
            <a href="#projects">
              View projects
              <ArrowDown aria-hidden="true" />
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="https://github.com/JunKit2003" {...externalLinkProps}>
              <img alt="" aria-hidden="true" className="brand-icon" src={githubIcon} />
              GitHub
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="https://www.linkedin.com/in/cheejunkit/" {...externalLinkProps}>
              <img alt="" aria-hidden="true" className="brand-icon" src={linkedinIcon} />
              LinkedIn
            </a>
          </Button>
        </div>
        <StatStrip />
      </div>
    </section>
  )
}
```

Note: `StatStrip` is created in Task 6. If executing in order, create a temporary minimal `StatStrip` returning `null` now, then replace it in Task 6. Alternatively execute Task 6 before building. Do not run the build until `StatStrip` exists.

- [ ] **Step 4: Replace `frontend/src/components/ConnectSection.tsx`**

```tsx
import { ExternalLink } from "lucide-react"

import { SectionHeading } from "@/components/SectionHeading"
import { Button } from "@/components/ui/button"
import { socialLinks } from "@/data/portfolio"

const externalLinkProps = {
  rel: "noreferrer noopener",
  target: "_blank",
}

function deviconUrl(slug: string) {
  return `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${slug}/${slug}-original.svg`
}

export function ConnectSection() {
  return (
    <section className="page-section" data-reveal id="connect">
      <div className="content-container">
        <SectionHeading
          eyebrow="Elsewhere"
          title="Connect"
          description="Find me on GitHub and LinkedIn."
        />
        <div className="connect-grid">
          {socialLinks.map((link) => (
            <div className="connect-card" key={link.label}>
              <div className="connect-copy">
                <img
                  alt=""
                  aria-hidden="true"
                  className="brand-icon brand-icon-lg"
                  loading="lazy"
                  src={deviconUrl(link.iconSlug)}
                />
                <div>
                  <h3>{link.label}</h3>
                  <p>{link.description}</p>
                </div>
              </div>
              <Button asChild variant="outline">
                <a href={link.href} {...externalLinkProps}>
                  Open {link.label}
                  <ExternalLink aria-hidden="true" />
                </a>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Add icon styles to `frontend/src/index.css`**

Append:

```css
.brand-icon {
  width: 1rem;
  height: 1rem;
  object-fit: contain;
}

.brand-icon-lg {
  width: 1.5rem;
  height: 1.5rem;
}

.connect-copy {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stack-card [data-slot="card-title"] {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stack-group-icon {
  width: 1.1rem;
  height: 1.1rem;
  color: var(--primary);
}

.skill-badge {
  gap: 0.35rem;
}

.skill-icon {
  width: 0.9rem;
  height: 0.9rem;
  object-fit: contain;
}
```

- [ ] **Step 6: Verify**

Run: `cd frontend && npm run build`
Expected: build completes with no errors (defer if `StatStrip` from Task 6 is not yet created).

---

### Task 3: Scroll reveal and active navigation hooks

**Files:**
- Create: `frontend/src/hooks/useReveal.ts`
- Create: `frontend/src/hooks/useActiveSection.ts`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Produces: `useReveal(): void` (observes `[data-reveal]` on mount); `useActiveSection(ids: string[]): string`.

- [ ] **Step 1: Create `frontend/src/hooks/useActiveSection.ts`**

```ts
import { useEffect, useState } from "react"

export function useActiveSection(ids: string[]): string {
  const [activeId, setActiveId] = useState(ids[0] ?? "")

  useEffect(() => {
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null)

    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [ids])

  return activeId
}
```

- [ ] **Step 2: Create `frontend/src/hooks/useReveal.ts`**

```ts
import { useEffect } from "react"

export function useReveal(): void {
  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    )
    if (elements.length === 0) return

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches

    if (prefersReducedMotion) {
      elements.forEach((element) => element.classList.add("is-visible"))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add("is-visible")
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])
}
```

- [ ] **Step 3: Update `frontend/src/App.tsx`**

Add the import:

```tsx
import { useReveal } from "@/hooks/useReveal"
```

Call it as the first statement inside `App`:

```tsx
function App() {
  useReveal()

  return (
```

- [ ] **Step 4: Add reveal and section reveal attributes**

Add `data-reveal` to the `<section>` element in each of `StackSection.tsx`, `ProjectsSection.tsx`, `ExperienceSection.tsx`, `EducationSection.tsx`, and `ConnectSection.tsx`, for example:

```tsx
<section className="page-section" data-reveal id="projects">
```

- [ ] **Step 5: Add reveal styles to `frontend/src/index.css`**

Append:

```css
[data-reveal] {
  opacity: 0;
  transform: translateY(1.25rem);
  transition:
    opacity 600ms ease,
    transform 600ms ease;
  transition-delay: var(--reveal-delay, 0ms);
}

[data-reveal].is-visible {
  opacity: 1;
  transform: none;
}
```

Ensure the existing `@media (prefers-reduced-motion: reduce)` block remains; add these inside it:

```css
  [data-reveal] {
    opacity: 1;
    transform: none;
    transition: none;
  }
```

- [ ] **Step 6: Verify**

Run: `cd frontend && npm run build`
Expected: build completes with no errors.

---

### Task 4: Project filtering tabs and card interactions

**Files:**
- Create: `frontend/src/components/ui/tabs.tsx`
- Modify: `frontend/src/data/portfolio.ts`
- Modify: `frontend/src/components/ProjectsSection.tsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Consumes: `Project`, `projects`.
- Produces: `Project.category: "web" | "ai"`; exported `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`.

- [ ] **Step 1: Add `category` to the `Project` type and entries in `frontend/src/data/portfolio.ts`**

Change the `Project` type to include:

```ts
export type Project = {
  name: string
  description: string
  tools: string[]
  images: ProjectImage[]
  category: "web" | "ai"
  href?: string
  linkLabel?: string
  note?: string
}
```

Add a `category` property to each project:

```ts
category: "web", // Kubernetes Playground
category: "web", // Car Consignment Website
category: "web", // Bike Shop Website
category: "ai",  // Reinforcement Learning on Traffic Signals
category: "ai",  // LunarLander-v2 & CartPole-v3 RL
category: "web", // University Marketplace Website
```

- [ ] **Step 2: Create `frontend/src/components/ui/tabs.tsx`**

```tsx
import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-4", className)} {...props} />
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex w-fit items-center justify-center gap-1 rounded-lg border border-border bg-muted p-1 text-muted-foreground",
        className,
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
```

- [ ] **Step 3: Replace `frontend/src/components/ProjectsSection.tsx`**

```tsx
import { ExternalLink } from "lucide-react"

import { SectionHeading } from "@/components/SectionHeading"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { projects, type Project } from "@/data/portfolio"

const externalLinkProps = {
  rel: "noreferrer noopener",
  target: "_blank",
}

const filters = [
  { value: "all", label: "All" },
  { value: "web", label: "Web" },
  { value: "ai", label: "AI & RL" },
] as const

function ProjectGrid({ items }: { items: Project[] }) {
  return (
    <div className="projects-grid">
      {items.map((project) => {
        const isPaired = project.images.length > 1

        return (
          <Card className="project-card" key={project.name}>
            <div
              className={
                isPaired ? "project-media project-media-paired" : "project-media"
              }
            >
              {project.images.map((image) => (
                <img alt={image.alt} key={image.src} loading="lazy" src={image.src} />
              ))}
            </div>
            <CardHeader>
              <CardTitle>{project.name}</CardTitle>
              <CardDescription className="project-tools">
                {project.tools.join(" · ")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="project-description">{project.description}</p>
            </CardContent>
            <CardFooter className="project-footer">
              {project.href ? (
                <Button asChild size="sm" variant="outline">
                  <a href={project.href} {...externalLinkProps}>
                    {project.linkLabel}
                    <ExternalLink aria-hidden="true" />
                  </a>
                </Button>
              ) : (
                <span className="project-note">{project.note}</span>
              )}
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}

export function ProjectsSection() {
  return (
    <section className="page-section" data-reveal id="projects">
      <div className="content-container">
        <SectionHeading
          eyebrow="Selected work"
          title="Projects"
          description="A mix of product work, experiments, and research projects."
        />
        <Tabs className="projects-tabs" defaultValue="all">
          <TabsList aria-label="Filter projects">
            {filters.map((filter) => (
              <TabsTrigger key={filter.value} value={filter.value}>
                {filter.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {filters.map((filter) => (
            <TabsContent key={filter.value} value={filter.value}>
              <ProjectGrid
                items={projects.filter(
                  (project) =>
                    filter.value === "all" || project.category === filter.value,
                )}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Add interaction and tab styles to `frontend/src/index.css`**

Append:

```css
.projects-tabs {
  margin-top: 2.5rem;
}

.project-card {
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.project-card:hover,
.project-card:focus-within {
  transform: translateY(-4px);
  border-color: color-mix(in oklch, var(--primary) 45%, var(--border));
  box-shadow: 0 1rem 2.5rem oklch(0 0 0 / 0.18);
}

.project-media img {
  transition: transform 400ms ease;
}

.project-card:hover .project-media img,
.project-card:focus-within .project-media img {
  transform: scale(1.04);
}
```

Add inside the existing `@media (prefers-reduced-motion: reduce)` block:

```css
  .project-card:hover,
  .project-card:focus-within,
  .project-card:hover .project-media img,
  .project-card:focus-within .project-media img {
    transform: none;
  }
```

- [ ] **Step 5: Verify**

Run: `cd frontend && npm run build`
Expected: build completes with no errors.

---

### Task 5: Experience accordion

**Files:**
- Create: `frontend/src/components/ui/accordion.tsx`
- Modify: `frontend/src/components/ExperienceSection.tsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Produces: `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`.

- [ ] **Step 1: Create `frontend/src/components/ui/accordion.tsx`**

```tsx
import * as React from "react"
import { Accordion as AccordionPrimitive } from "radix-ui"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

function Accordion({ ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b border-border", className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "flex flex-1 items-start justify-between gap-4 py-4 text-left transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&[data-state=open]>svg]:rotate-180",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div className={cn("pt-0 pb-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
```

- [ ] **Step 2: Add accordion animation theme entries to `frontend/src/index.css`**

Add after the `@theme inline { ... }` block:

```css
@theme {
  --animate-accordion-down: accordion-down 200ms ease-out;
  --animate-accordion-up: accordion-up 200ms ease-out;
}

@keyframes accordion-down {
  from {
    height: 0;
  }
  to {
    height: var(--radix-accordion-content-height);
  }
}

@keyframes accordion-up {
  from {
    height: var(--radix-accordion-content-height);
  }
  to {
    height: 0;
  }
}
```

- [ ] **Step 3: Replace `frontend/src/components/ExperienceSection.tsx`**

```tsx
import { SectionHeading } from "@/components/SectionHeading"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { experience } from "@/data/portfolio"

export function ExperienceSection() {
  return (
    <section className="page-section" data-reveal id="experience">
      <div className="content-container">
        <SectionHeading eyebrow="Career" title="Experience" />
        <Accordion
          className="experience-accordion"
          collapsible
          defaultValue="experience-0"
          type="single"
        >
          {experience.map((entry, index) => (
            <AccordionItem key={`${entry.role}-${entry.period}`} value={`experience-${index}`}>
              <AccordionTrigger>
                <span className="experience-trigger">
                  <span className="experience-role">{entry.role}</span>
                  <span className="experience-company">{entry.company}</span>
                  <span className="experience-period">{entry.period}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="timeline-bullets">
                  {entry.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Add accordion styles and remove the unused timeline styles from `frontend/src/index.css`**

Append:

```css
.experience-accordion {
  margin-top: 2.5rem;
}

.experience-trigger {
  display: grid;
  gap: 0.15rem;
}

.experience-role {
  font-size: 1.05rem;
  font-weight: 600;
}

.experience-company {
  color: var(--primary);
  font-size: 0.9rem;
  font-weight: 600;
}

.experience-period {
  color: var(--muted-foreground);
  font-size: 0.8rem;
}

.experience-accordion [data-slot="accordion-content"] .timeline-bullets {
  margin-top: 0;
}
```

Delete the now-unused `.timeline`, `.timeline-item`, `.timeline-item:first-child`, `.timeline-period`, `.timeline-body h3`, `.timeline-company` rules, plus the `.timeline-item` rule inside the `@media (max-width: 50rem)` block.

- [ ] **Step 5: Verify**

Run: `cd frontend && npm run build`
Expected: build completes with no errors.

---

### Task 6: Count-up statistics and final verification

**Files:**
- Create: `frontend/src/components/CountUp.tsx`
- Create: `frontend/src/components/StatStrip.tsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Produces: `CountUp({ value, duration? }: { value: number; duration?: number }): JSX.Element`; `StatStrip(): JSX.Element`.

- [ ] **Step 1: Create `frontend/src/components/CountUp.tsx`**

```tsx
import { useEffect, useRef, useState } from "react"

type CountUpProps = {
  value: number
  duration?: number
}

export function CountUp({ value, duration = 1200 }: CountUpProps) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches

    if (prefersReducedMotion) {
      setDisplay(value)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || started.current) return
          started.current = true

          const start = performance.now()
          const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1)
            setDisplay(Math.round(progress * value))
            if (progress < 1) requestAnimationFrame(tick)
          }

          requestAnimationFrame(tick)
          observer.disconnect()
        })
      },
      { threshold: 0.5 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [duration, value])

  return <span ref={ref}>{display}</span>
}
```

- [ ] **Step 2: Create `frontend/src/components/StatStrip.tsx`**

```tsx
import { CountUp } from "@/components/CountUp"
import { education, experience, projects, skillGroups } from "@/data/portfolio"

const stats = [
  { label: "Projects", value: projects.length },
  { label: "Skill areas", value: skillGroups.length },
  { label: "Roles", value: experience.length },
  { label: "Degrees", value: education.length },
]

export function StatStrip() {
  return (
    <dl className="stat-strip">
      {stats.map((stat) => (
        <div className="stat" key={stat.label}>
          <dt>{stat.label}</dt>
          <dd>
            <CountUp value={stat.value} />
          </dd>
        </div>
      ))}
    </dl>
  )
}
```

- [ ] **Step 3: Add stat styles to `frontend/src/index.css`**

Append:

```css
.stat-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 8rem), 1fr));
  gap: 1rem;
  margin: 3rem 0 0;
  padding-top: 1.5rem;
  border-top: 1px solid color-mix(in oklch, var(--border) 55%, transparent);
}

.stat {
  display: grid;
  gap: 0.25rem;
}

.stat dt {
  color: var(--muted-foreground);
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.stat dd {
  margin: 0;
  color: var(--foreground);
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 750;
  letter-spacing: -0.04em;
}
```

- [ ] **Step 4: Build and lint**

Run: `cd frontend && npm run build`
Expected: TypeScript and Vite complete with no errors.

Run: `cd frontend && npm run lint`
Expected: no errors; only the existing generated `ui/button.tsx` and `ui/badge.tsx` fast-refresh warnings.

- [ ] **Step 5: Preview and manual checks**

Run: `cd frontend && npm run preview -- --port 4173`

Check:
- Theme toggle switches palettes, persists after reload, and defaults to OS preference.
- Active nav link updates while scrolling and uses `aria-current`.
- Project filter tabs show All / Web / AI & RL and filter correctly.
- Experience accordion expands and collapses; first item open.
- Counters animate to 6, 8, 4, 2.
- Narrow viewport (~320px) has no horizontal overflow.
- With reduced motion enabled, content is visible without transitions.

- [ ] **Step 6: Report**

Report the files changed and the verification output. Do not commit unless the user asks.
