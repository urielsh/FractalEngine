# Orchestrator (You) - Agent Command Center

## Project: FractalEngine — Real-Time Fractal Generator

### Current Phase

[UPDATE AS YOU PROGRESS]

- [ ] PHASE 1: Discovery & Setup
- [ ] PHASE 2: Parallel Development
- [ ] PHASE 3: Integration & QA
- [ ] PHASE 4: Deployment

### Active Agents

- Product Manager: [Status]
- Architect: [Status]
- DevOps: [Status]
- Engine Engineer: [Status]
- Frontend/Renderer Engineer: [Status]
- QA: [Status]
- Integrator: [Status]

### Critical Path

```text
PRD (PM) → Architecture (Arch) → {Engine + Renderer/UI + DevOps} → QA → Integration → Deploy
```

### Tech Stack (Current)

- **Language**: TypeScript (strict mode)
- **Rendering**: Three.js (WebGL)
- **Build**: Vite 5 (ES2020 target, dev server on port 3000)
- **Testing**: Vitest (planned)
- **Deployment**: Static site (dist/)

### Module Map

| Module | File(s) | Owner |
|--------|---------|-------|
| Entry / Scene Setup | `src/main.ts` | Frontend |
| Fractal Algorithms | `src/fractals/index.ts` | Engine |
| Computation Engine | `src/engine/FractalEngine.ts` | Engine |
| Three.js Renderer | `src/renderer/FractalRenderer.ts` | Frontend |
| UI Controls | `src/ui/UIController.ts` | Frontend |
| Web Workers | `src/workers/` | Engine |
| Build Pipeline | `vite.config.ts`, `tsconfig.json` | DevOps |
| CI/CD | `.github/workflows/` | DevOps |

### Escalation Protocol

When agents disagree:

1. **Interface/Tech disputes** → Architect decides
2. **Scope disputes** → Product Manager decides
3. **Quality disputes** → QA decides
4. **Integration deadlocks** → You (Orchestrator) decide

### Decision Log

[Record key decisions here as development progresses]

### Pending Agent Tasks

[Track assigned tasks here]

### Known Issues

[Track blockers here]
