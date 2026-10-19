# Tejas Parjane — Portfolio + Cognitive OS

A static, responsive portfolio for Tejas Parjane covering AI engineering, data science, and product building, plus an interactive, browser-only decision-intelligence laboratory called **Cognitive OS**.

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
| `/projects/jaheeratech/` | Implemented case study (Phase 2) |
| `/projects/attention-os/` | Implemented case study (Phase 2) |
| `/projects/forecasting-engine/` | Implemented case study (Phase 2) |
| `/projects/agentci/` | Implemented case study (Phase 2) |
| `/cognitive-os/` | Laboratory overview; all three challenges live |
| `/cognitive-os/business-diagnosis/` | Implemented interactive challenge (Phase 3) |
| `/cognitive-os/agent-autopsy/` | Implemented interactive challenge (Phase 4) |
| `/cognitive-os/hypothesis-arena/` | Implemented interactive challenge (Phase 5) |
| `/engineering/` | Implemented overview of architecture and practices |
| `/experience/` | Implemented |
| `/about/` | Implemented |
| `*` | 404 page |

## Deployment

Pushes to `main` run `.github/workflows/deploy.yml`, which installs dependencies, type-checks, runs tests, builds, and deploys `dist/` to GitHub Pages.

This repository is configured for the **user page** `https://tejas-parjane.github.io/`, so Vite's `base` is `/`.

### Direct-route refresh

GitHub Pages has no server-side SPA fallback. `scripts/post-build.mjs` runs after every build and:

1. Emits each published route as a real `dist/<route>/index.html` so direct URLs and refreshes return HTTP 200 rather than the 404 document.
2. Copies `dist/index.html` to `dist/404.html` so unknown paths still boot the client router and render the in-app 404 view.
3. Writes `.nojekyll`.

When a new route is added, add it to the `routes` list in `scripts/post-build.mjs`.

### Custom domain

If a custom domain (for example `tejasparjane.in`) is configured in **Settings → Pages**, update the canonical URL and sitemap entries in `index.html`, `src/hooks/useDocumentMeta.ts`, `public/sitemap.xml`, and `public/robots.txt`. The Vite `base` can remain `/`.

## Content and data integrity

- `src/data/profile.ts` — verified contact details.
- `src/data/projects.ts` — project metadata with explicit `implemented` / `in-development` / `planned` status and verified links.
- `src/data/experience.ts` — professional history from the current resume.
- `src/case-studies/types.ts` — typed contract for the Phase 2 case studies.
- `src/cognitive-os/types.ts` — shared challenge contract (steps, evidence, hypotheses, decision targets, scoring, decision records).
- `src/cognitive-os/engine.ts` — deterministic reducer, state validation, scoring, and reproducibility fingerprint, shared by every challenge.
- `src/cognitive-os/datasets/businessDiagnosis.ts` — documented, seeded synthetic funnel dataset (no randomness at runtime).
- `src/cognitive-os/analysis/businessDiagnosisAnalysis.ts` — independent, unit-tested funnel, standardisation, and shift-share calculations.
- `src/cognitive-os/challenges/businessDiagnosis.ts` — challenge definition, reference reading, and the designed scoring rubric.
- `src/cognitive-os/datasets/agentAutopsy.ts` — documented, seeded synthetic agent execution trace (fixed fixture; only latencies are generated).
- `src/cognitive-os/analysis/agentAutopsyAnalysis.ts` — independent, unit-tested trace calculations (retrieval audit, buffer diff, step audit, answer support, policy audit, earliest-failure computation).
- `src/cognitive-os/challenges/agentAutopsy.ts` — Agent Autopsy definition, computed reference reading, and rubric.
- `src/cognitive-os/datasets/hypothesisArena.ts` — documented, seeded synthetic activation dataset (authored aggregates; a fixed-seed daily series generated from them) plus the declared experiment fixtures.
- `src/cognitive-os/analysis/hypothesisArenaAnalysis.ts` — independent, unit-tested activation decomposition, noise band, Bayesian posterior, expected information gain, and information-per-cost ranking.
- `src/cognitive-os/challenges/hypothesisArena.ts` — Hypothesis Arena definition, computed reference reading, and rubric.

The Cognitive OS is browser-only and deterministic: no LLM, no backend, and no arbitrary code execution. Reference conclusions and the rubric are derived from the dataset or trace by the analysis module, not from hardcoded outcomes. Every challenge runs on the same engine and shares the same state machine, scoring primitives, and fingerprint; a challenge adds only its own dataset, analysis, definition, and view.

Two engine capabilities are additive and used only where declared: required *decision targets* beyond the hypothesis pair (Agent Autopsy), and budgeted *experiments* with declared cost, duration, risk, and revealed evidence (Hypothesis Arena). Challenges that declare neither behave exactly as before. Hypothesis Arena's Bayesian updating uses documented priors and likelihoods; expected information gain is computed from the belief distribution, so the rubric rewards a defensible experiment under the beliefs available at the time, not the author's intended sequence.

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
├── case-studies/   # case-study contracts and content
├── cognitive-os/   # challenge engine, dataset, analysis, and components
├── hooks/          # document metadata
├── lib/            # small shared utilities
└── styles/         # design tokens and global styles
```

Domain logic for the Cognitive OS lives outside the page components, so calculations, scoring, state transitions, and decision records are unit-tested independently of rendering.

## Phases

- **Phase 1:** foundation, theme system, homepage, project index and cards, experience, about, placeholders, tests, and deployment.
- **Phase 2:** verified project case studies.
- **Phase 3:** Cognitive OS engine and the interactive Business Diagnosis challenge.
- **Phase 4:** Agent Autopsy — evidence-based debugging of a synthetic agent trace on the same engine.
- **Phase 5 (this release):** Hypothesis Arena — experimental design and Bayesian belief updating under a budget on the same engine.
- **Phase 6:** quality and launch verification.
- **Phase 7 (optional):** secure LLM investigator behind a backend. No provider credentials belong in this static bundle.
