# HVAC Toolkit

A client-side HVAC/MEP calculator suite built with Next.js App Router, TypeScript, Tailwind CSS v4, Zustand and Vitest.

## Setup

```bash
npm install
npm run dev
npm test
npm run build
```

Open http://localhost:3000. The app stores settings and saved results in localStorage; no backend is required.

## Tools

- Psychrometric state chart and property solver
- Sensible/latent air-side load estimate
- HVAC unit converter

## Add a tool

1. Add pure calculations and tests under `src/lib/<tool>/`.
2. Create a client page under `src/tools/<tool>/page.tsx`.
3. Add a route under `src/app/<route>/page.tsx`.
4. Add one entry to `src/tools/registry.ts` with id, title, icon, href and component.
5. Save reusable values as SI values with quantity types using the Zustand store.

All calculations use SI internally. Conversion happens at the UI boundary in `src/lib/units.ts`. The load calculator uses an assumed air density of 1.2 kg/m³ and is a simplified air-side estimate, not a full room load or equipment selection.

## Deploy

For a live hosted app, import this GitHub repository into Vercel:

1. Sign in to Vercel with GitHub.
2. Select `idbalorg/hvac-toolkit` and import it as a Next.js project.
3. Keep the default build command (`npm run build`) and output settings.
4. Deploy. Vercel will create preview deployments for branches and update production from the main branch.
