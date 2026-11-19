# Portfolio frontend

This directory contains the standalone React, TypeScript, Vite and Tailwind CSS
frontend for the portfolio. Animation uses [Motion](https://motion.dev) and
smooth scrolling uses [Lenis](https://lenis.darkroom.engineering). The effect
components in `src/components/fx/` follow the copy-in pattern of Aceternity UI
and Magic UI rather than being installed as a package.

## Layout

- `src/data/portfolio.ts`: all page content (skills, projects, roles, education, links).
- `src/components/sections/`: one component per page section.
- `src/components/fx/`: reusable effects (particle field, spotlight cards,
  magnetic buttons, split-text reveal, rotating words, marquee, count-up).
- `src/index.css`: theme tokens (dark and light) and effect styles.

Every effect respects `prefers-reduced-motion`: movement, parallax, smooth
scrolling and the particle animation switch off, and content shows straight away.

## Prerequisites

- Node.js 20.19+ or 22.12+
- npm 10+

## Run locally

From the repository root, install dependencies and start the Vite development
server:

```bash
cd frontend
npm install
npm run dev
```

Create a production build with:

```bash
cd frontend
npm run build
```
