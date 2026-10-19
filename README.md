# Tejas Parjane — Portfolio + Cognitive OS

A static, responsive portfolio for Tejas Parjane covering AI engineering, data science, and product building, plus the foundation for an interactive decision-intelligence laboratory called **Cognitive OS**.

The site is deliberately honest about implementation status: it does not publish unverified metrics, fabricated project links, or simulated results presented as live outcomes.

## Stack

- React 19 + TypeScript (strict)
- Vite 8
- Tailwind CSS 4
- React Router
- Lucide icons
- Vitest + React Testing Library
- Playwright (essential end-to-end checks)
- GitHub Actions → GitHub Pages

## Local development

```bash
npm install
npm run dev        # http://localhost:5173
```

## Checks

```bash
npm run typecheck  # TypeScript project build (strict)
npm run test:run   # unit and component tests
npm run lint       # oxlint
npm run build      # typecheck + production build
```

Optional end-to-end tests (requires Playwright browsers):

```bash
npx playwright install chromium
npm run test:e2e
```

## Routes

| Route | Status |
| --- | --- |
| `/` | Implemented |
| `/projects/` | Implemented |
| `/projects/jaheeratech/` | Placeholder case study (Phase 2) |
| `/projects/attention-os/` | Placeholder case study (Phase 2) |
| `/projects/forecasting-engine/` | Placeholder case study (Phase 2) |
| `/projects/agentci/` | Placeholder case study (Phase 2) |
| `/cognitive-os/` | Laboratory overview implemented; challenges in development |
| `/cognitive-os/business-diagnosis/` | Placeholder (Phase 4) |
| `/cognitive-os/agent-autopsy/` | Placeholder (Phase 5) |
| `/cognitive-os/hypothesis-arena/` | Placeholder (Phase 6) |
| `/engineering/` | Implemented overview of architecture and practices |
| `/experience/` | Implemented |
| `/about/` | Implemented |
| `*` | 404 page |

## Deployment

Pushes to `main` run `.github/workflows/deploy.yml`, which installs dependencies, type-checks, runs tests, builds, and deploys `dist/` to GitHub Pages.

This repository is configured for the **user page** `https://tejas-parjane.github.io/`, so Vite's `base` is `/`.

### Direct-route refresh

GitHub Pages has no server-side SPA fallback. `scripts/post-build.mjs` copies `dist/index.html` to `dist/404.html` after every build so direct URLs and refreshes resolve to the application. It also writes `.nojekyll`.

### Custom domain

If a custom domain (for example `tejasparjane.in`) is configured in **Settings → Pages**, update the canonical URL and sitemap entries in `index.html`, `src/hooks/useDocumentMeta.ts`, `public/sitemap.xml`, and `public/robots.txt`. The Vite `base` can remain `/`.

## Content and data integrity

- `src/data/profile.ts` — verified contact details.
- `src/data/projects.ts` — project metadata with explicit `implemented` / `in-development` / `planned` status and verified links.
- `src/data/experience.ts` — professional history from the current resume.
- `src/case-studies/types.ts` — typed contract for the Phase 2 case studies.

External links are verified before publication. Attention-OS, Forecasting Engine, AgentCI, Growth Decision Engine, and the Business-Intelligent RAG Agent repositories, along with the JaheeraTech frontend and the two GitHub Pages demos, were reachable when this release was prepared.

### Resume

The resume PDF has not been supplied yet. `/about#resume` explains that the latest resume is available on request. To publish a downloadable PDF:

1. Add `public/resume.pdf`.
2. Update `resume` in `src/data/profile.ts` to `{ status: 'published', path: '/resume.pdf', ... }`.
3. Update the navigation and footer resume links to point at the file.

Do not publish a resume that has not been approved.

## Architecture

```text
src/
├── app/            # theme provider and application state
├── components/     # layout, navigation, projects, UI primitives
├── pages/          # route-level views
├── data/           # typed profile, project, experience, capability data
├── case-studies/   # case-study contracts (content in Phase 2)
├── hooks/          # document metadata
├── lib/            # small shared utilities
└── styles/         # design tokens and global styles
```

Domain logic for Cognitive OS will live outside the page components, so calculations, scoring, state transitions, and decision records can be unit-tested independently.

## Phases

- **Phase 1 (this release):** foundation, theme system, homepage, project index and cards, experience, about, placeholders, tests, and deployment.
- **Phase 2:** verified project case studies.
- **Phase 3:** Cognitive OS foundation and typed challenge contracts.
- **Phase 4:** Business Diagnosis.
- **Phase 5:** Agent Autopsy.
- **Phase 6:** Hypothesis Arena.
- **Phase 7:** quality and launch verification.
- **Phase 8 (optional):** secure LLM investigator behind a backend. No provider credentials belong in this static bundle.
