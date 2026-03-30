# AF PFRA App

## Overview
A web-based **Physical Fitness Readiness Assessment (PFRA) Calculator** for the United States Air Force. Allows service members to calculate fitness scores based on official DAFMAN 36-2905 standards.

## Tech Stack
- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite 8
- **Package Manager:** npm
- **Testing:** Vitest
- **Linting:** ESLint with TypeScript and React plugins

## Project Structure
- `src/` - Source code
  - `components/` - UI components (EventInput, HamrPlayer, RunTracker)
  - `hooks/` - Custom React hooks (useHistory for localStorage)
  - `assets/` - Static images and icons
  - `scoring.ts` - Scoring logic engine
  - `scoringData.json` - Official AF scoring tables
  - `types.ts` - TypeScript interfaces
  - `App.tsx` / `main.tsx` - Application entry points
- `public/` - Static assets

## Key Features
- Scoring for multiple fitness events (1.5-mile run, 20m HAMR, push-ups, sit-ups, WHtR)
- Age and gender-based scoring tables
- HAMR shuttle run timer/player
- Assessment history tracking (localStorage)
- Export functionality

## Development
```bash
npm run dev      # Start dev server on port 5000
npm run build    # Build for production
npm run test     # Run tests
npm run lint     # Lint code
```

## Configuration
- Dev server: `0.0.0.0:5000` with `allowedHosts: true` for Replit proxy compatibility
- Base URL: `/` (changed from `/af-pfra-app/` for Replit compatibility)
- Deployment: Static site, builds to `dist/`
