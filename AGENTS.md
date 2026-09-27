# Lunar Ops

Purpose: NASA Space Apps Challenge 2026 — Junior Astronaut Mission Trainer.

## Technology direction

- TypeScript everywhere.
- Monorepo.
- Frontend: React + Vite.
- Backend: NestJS.
- Package manager: pnpm.
- Monorepo task runner: Turborepo.
- Frontend state: Zustand.
- Styling: Tailwind CSS.
- Charts: Recharts.
- Animation: Framer Motion.
- Validation: Zod.

## Architecture rules

### apps/web

- React frontend only.
- Responsible for UI, rendering, user input, charts and animations.
- Must not contain simulation or business logic.
- Must not call NASA APIs directly.

### apps/api

- NestJS backend.
- Responsible for HTTP API, application use cases, game sessions, NASA integrations, caching and external-service adapters.
- The backend is authoritative for game state.

### packages/contracts

- Shared frontend/backend API contracts and TypeScript types.
- Must not depend on React or NestJS.

### packages/game-core

- Pure TypeScript simulation/domain engine.
- Contains resource calculations, event resolution, crew health, mission progression and other game rules.
- Must not depend on React, NestJS, HTTP, databases or NASA APIs.
- Prefer deterministic and testable pure functions.

### packages/game-config

- Game balancing and configuration.
- Contains mission parameters, resource values, difficulty settings, modules and event configuration.
- Avoid hardcoded balancing constants inside UI or backend services.

### NASA integrations

- External NASA APIs must be accessed only through apps/api.
- Raw NASA responses must be mapped into our own internal contracts before reaching game-core.
- game-core must never depend on NASA-specific response formats.
- Provide offline/historical fallback data where appropriate.

## General rules

- Keep modules small and focused.
- Prefer explicit types.
- Avoid `any` unless absolutely necessary.
- Do not duplicate shared models between frontend and backend.
- Do not introduce new frameworks or dependencies without explaining why.
- Do not add authentication, databases, Docker, AI integrations or other infrastructure unless explicitly requested.
- Do not overengineer the MVP.
