# React Portfolio Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Replace the legacy static portfolio with a responsive React + TypeScript + ShadCN site contained in `frontend/`, with no contact form or backend dependency.

**Architecture:** A Vite React/TypeScript application lives entirely under `frontend/`. `App.tsx` composes focused page sections; portfolio content is represented as typed data; ShadCN UI components and Tailwind provide accessible reusable UI, with custom styles for the site's visual identity. The existing static assets move to Vite's public assets folder.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS, ShadCN UI, Lucide icons.

**Spec:** `docs/superpowers/specs/2026-11-09-react-portfolio-design.md`

## Global Constraints

- Place the complete website application and its assets in `frontend/`.
- Build with React, TypeScript, Vite, and ShadCN UI components.
- Remove the email form and all n8n submission behavior; retain LinkedIn and GitHub links.
- Keep the frontend independently buildable and deployable as a static site, leaving repository root available for future services.
- Do not create a backend, contact endpoint, or email integration now.
- Do not add unverified claims about responsibilities, impact, or years in role.
- Preserve existing portfolio identity, project links, social links, education, and work history where applicable.
- Use the user's supplied current stack: React/TypeScript; ASP.NET/C#; MSSQL/PostgreSQL; Azure services and CLI/MCP; Azure DevOps; AI CLI tools; Coralogix/New Relic; and the listed architecture/tooling topics.

## Review Focus

- Narrow mobile view and menu state: navigation must remain usable without horizontal overflow. (Task 2 manual viewport check.)
- Reduced-motion preference: page interactions and transitions must not force motion. (Task 2 inspect reduced-motion behavior.)
- Missing project media: project cards should remain readable if an image fails. (Task 3 verify text and link remain visible with media unavailable.)
- External destinations: GitHub, LinkedIn, and project links should remain correct and open safely. (Task 3 verify URLs and `rel` attributes.)
- Static hosting path behavior: built app must resolve assets from the deployment root. (Task 4 production build and preview check.)

---

### Task 1: Scaffold the frontend application

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/index.html`
- Create: `frontend/tsconfig.json` and related TypeScript config files
- Create: `frontend/vite.config.ts`
- Create: `frontend/components.json`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/index.css`
- Create: `frontend/src/lib/utils.ts`
- Create: `frontend/README.md`

**Interfaces:**
- Produces: Vite dev/build scripts; `@/` alias to `frontend/src`; ShadCN `cn(...inputs: ClassValue[]): string` helper.

- [x] **Step 1: Initialize Vite React TypeScript app inside `frontend/`**

Use the React TypeScript Vite template. Keep all package configuration and source under `frontend/` and define `dev`, `build`, and `preview` scripts there.

- [x] **Step 2: Configure Tailwind and ShadCN UI**

Initialize ShadCN for the Vite app, configure the source alias and CSS variables, and add only the primitives required by the page (Button, Badge, Card, Separator). Use the CSS variables from the ShadCN theme as the basis for the portfolio palette.

- [x] **Step 3: Add a frontend README**

Document Node/npm prerequisites and the exact commands `cd frontend`, `npm install`, `npm run dev`, and `npm run build`.

- [x] **Step 4: Build the empty application**

Run: `npm run build` from `frontend/`
Expected: Vite completes a production build into `frontend/dist/`.

### Task 2: Build the portfolio layout and responsive navigation

**Files:**
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/components/SiteHeader.tsx`
- Create: `frontend/src/components/HeroSection.tsx`
- Create: `frontend/src/components/SectionHeading.tsx`
- Create: `frontend/src/components/SiteFooter.tsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Consumes: Task 1 ShadCN components and `cn` utility.
- Produces: `App` as page composition; `SiteHeader` with working section anchors and accessible mobile menu; reusable `SectionHeading({ eyebrow, title, description? })`.

- [x] **Step 1: Create the site header and mobile navigation**

Use semantic `<header>` and `<nav>`, section anchors for About, Stack, Projects, Experience, Education, and Connect. On mobile, use a ShadCN Button with Lucide menu/close icons, `aria-expanded`, `aria-controls`, Escape-to-close, and close-on-link-select behavior. Keep keyboard focus visible.

- [x] **Step 2: Create the hero and section heading components**

Present Chee Jun Kit as a Junior Software Engineer at The Access Group, Computer Science (AI) graduate, and full-stack developer. Include direct links to projects, GitHub, and LinkedIn; do not introduce unsupported claims.

- [x] **Step 3: Compose page shell and footer**

Build a single-page hierarchy with consistent spacing, a centered content width, responsive layout, dark neutral palette with restrained blue accent, visible section anchors, and current year in the footer. Add `prefers-reduced-motion` handling in CSS.

- [x] **Step 4: Inspect responsive behavior**

Manually review the page at narrow mobile and desktop widths. Confirm no horizontal overflow, usable mobile navigation, visible focus indication, and reduced motion styles.

### Task 3: Add typed portfolio content and migrate assets

**Files:**
- Create: `frontend/src/data/portfolio.ts`
- Create: `frontend/src/components/StackSection.tsx`
- Create: `frontend/src/components/ProjectsSection.tsx`
- Create: `frontend/src/components/ExperienceSection.tsx`
- Create: `frontend/src/components/EducationSection.tsx`
- Create: `frontend/src/components/ConnectSection.tsx`
- Move: `logo.png`, `k8s.png`, `CarConsignmentWebsite.png`, `faction.png`, `sumo.gif`, `cart_pole.gif`, `lunar_lander.gif`, `unm.png` to `frontend/public/`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Produces: typed `skills`, `projects`, `experience`, and `education` content arrays consumed by focused section components.
- Produces: section ids `about`, `stack`, `projects`, `experience`, `education`, and `connect` used by navigation anchors.

- [x] **Step 1: Define typed content data**

Include the supplied stack grouped as Frontend, Backend, Data, Cloud & Infrastructure, Source Control & Delivery, AI & Developer Tools, Observability, and Architecture & Extensibility. Include React, TypeScript, ShadCN; ASP.NET/C#; MSSQL and PostgreSQL; Azure Static Web Apps, Container Apps, Front Door, Azure CLI/MCP; Git and Azure DevOps Boards/Tickets/CI/CD; Claude, Codex, Devin and Ubuntu/WSL; Coralogix and New Relic; microfrontends, OpenComponents Registry, plugins, MCP servers, workflows, Obra Superpowers, and Graphify. Retain project names, descriptions, current links, role dates, and education facts from the existing page without inventing new achievements.

- [x] **Step 2: Move and reference existing project assets**

Move all listed local page assets into `frontend/public/`. Reference them with root-relative public paths such as `/k8s.png`. Keep the existing favicon/logo.

- [x] **Step 3: Implement stack and project sections**

Use responsive ShadCN Card and Badge components. Ensure project title, description, technology list, and link remain useful if its image cannot load. Preserve paired reinforcement-learning visuals as one project card.

- [x] **Step 4: Implement experience and education sections**

Present Junior Software Engineer and Graduate Software Engineer timeline entries at The Access Group, followed by existing roles and education. Keep source dates and rewrite generic copy only to reflect facts explicitly supplied by the user.

- [x] **Step 5: Implement connect section and remove email form**

Provide GitHub and LinkedIn links. Do not render email, message fields, submit controls, or a replacement backend placeholder.

- [x] **Step 6: Verify content and external links**

Manually check each preserved project/social URL, safe external-link attributes, section anchor ids, and all moved media references.

### Task 4: Remove legacy root app and verify static deployment

**Files:**
- Delete: root `index.html`
- Delete: root `style.css`
- Delete: root `scripts.js`
- Modify: `frontend/vite.config.ts` only if needed for root-relative static asset paths

**Interfaces:**
- Consumes: complete `frontend/` application from Tasks 1–3.
- Produces: one independently buildable static site at `frontend/dist/` with no legacy n8n behavior.

- [x] **Step 1: Remove superseded static entrypoint and scripts**

Delete the root HTML, stylesheet, and script after confirming their page content and project assets are represented in `frontend/`.

- [x] **Step 2: Build production output**

Run: `npm run build` from `frontend/`
Expected: TypeScript and Vite build complete successfully into `frontend/dist/`.

- [x] **Step 3: Preview the production build**

Run: `npm run preview` from `frontend/` and inspect the served page. Confirm assets load from the site root, navigation works, social/project links are intact, and no contact form or n8n endpoint is present.
