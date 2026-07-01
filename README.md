# Acre

A one-page concept site for Acre — a private, AI-powered wealth planning
practice. Built as a single continuous scroll: a quiet-luxury narrative that
resolves into six live, interactive product screens (dashboard, AI planner,
goals, budget, investments, financial health).

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4, custom design tokens (no default theme)
- Framer Motion for component motion, GSAP + ScrollTrigger and Lenis for
  scroll choreography
- Hand-built SVG charts (no charting library)

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm run lint    # eslint
```

All product data (`src/lib/data.ts`) is illustrative — this is a design
concept, not a connected product.
