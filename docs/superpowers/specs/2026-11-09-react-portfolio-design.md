# React Portfolio Redesign

## Intent

Modernize the portfolio to reflect Chee Jun Kit's current software engineering experience and day-to-day stack, using React and TypeScript so the site can grow beyond its original static HTML implementation.

## Goals

- Place the complete website application and its assets in `frontend/`.
- Build with React, TypeScript, Vite, and ShadCN UI components.
- Present current role, technologies, projects, education, and professional links in a polished responsive portfolio.
- Remove the email form and all n8n submission behavior; retain LinkedIn and GitHub links.
- Keep the frontend independently buildable and deployable as a static site, leaving repository root available for future services.

## Non-goals

- Create a backend, contact endpoint, or email integration now.
- Add unverified claims about responsibilities, impact, or years in role.
- Discard existing project examples or project media.

## Constraints

- Existing site consists of root `index.html`, `style.css`, `scripts.js`, and local image assets; no package manifest or app framework exists yet.
- Preserve existing portfolio identity, project links, social links, education, and work history where applicable.
- Use the user's supplied current stack: React/TypeScript; ASP.NET/C#; MSSQL/PostgreSQL; Azure services and CLI/MCP; Azure DevOps; AI CLI tools; Coralogix/New Relic; and the listed architecture/tooling topics.
- Existing employment dates are retained unless the source page has a factual inconsistency requiring a conservative wording adjustment.

## Approaches

1. **Standalone Vite app in `frontend/` (selected):** React + TypeScript + Vite with Tailwind and ShadCN UI. This keeps the app easy to deploy as static content and leaves the repository root ready for future backend services.
2. **Monorepo workspace:** root-level package manager workspace with frontend and reserved backend packages. This adds coordination and package-management setup before a backend exists.
3. **React without ShadCN:** use React/TypeScript with custom CSS only. This would avoid the UI component setup but would not apply the component library the user has been learning.

The user selected the React + TypeScript conversion and a `frontend/` boundary. The standalone Vite app with ShadCN is the recommended implementation of that direction.

## Design and behavior

- Create a responsive single-page portfolio with navigation, hero/profile, current stack grouped by domain, selected projects, experience, education, social links, and footer.
- Use ShadCN primitives where they improve consistency and accessibility; keep the visual treatment tailored to the portfolio rather than presenting a generic component showcase.
- Keep project media and the existing logo inside `frontend/public/` (or an equivalent Vite public asset location) and preserve working project/social destinations.
- Remove the contact form, its validation/status UI, its n8n endpoint, and obsolete form interactions.
- Keep existing role dates and describe the current position using only supplied details; don't invent achievements.

## Builder decisions

- Use Vite for local development and static production builds.
- Keep all frontend configuration, application source, styles, and website assets under `frontend/`.
- Use a small set of reusable React sections/components and data-driven lists for skills and projects.
- Maintain static hosting compatibility; no server-side rendering is needed.
