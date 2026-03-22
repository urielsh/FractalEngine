# Agent Communication Log

## Format for Agent-to-Agent Messages
When Agent X needs Agent Y's attention:
```
[AGENT HAND-OFF]
From: Engine Engineer Agent
To: Frontend/Renderer Engineer Agent
Priority: HIGH
Subject: New Fractal Type Ready
Message: MandelbrotPower fractal implementation complete with configurable exponent
Action Needed: Add UI controls for exponent parameter, test rendering
Updated Spec: /src/fractals/index.ts
```

## Escalation to Orchestrator
When agents are stuck or conflicted:
```
[ESCALATE TO ORCHESTRATOR]
Agent: Engine Engineer
Conflict: Renderer Agent wants different data format for color mapping
Reason: Current Uint8Array is inefficient for GPU upload
Options:
  A) Keep Uint8Array, convert in renderer
  B) Switch to Float32Array from engine
Recommendation: Option B (GPU-native format)
Awaiting: Human decision
```

## Status Board
| Agent | Status | Last Update | Blocker |
|-------|--------|-------------|---------|
| PM | [Status] | [Update] | [Blocker] |
| Arch | [Status] | [Update] | [Blocker] |
| Engine | [Status] | [Update] | [Blocker] |
| Frontend | [Status] | [Update] | [Blocker] |
| DevOps | [Status] | [Update] | [Blocker] |
| QA | [Status] | [Update] | [Blocker] |
| Integrator | [Status] | [Update] | [Blocker] |

## Hand-Offs

[Record hand-offs as they occur]

---

### File Structure Checklist
```
FractalEngine/
├── .claude/
│   ├── system-prompts/
│   │   ├── product-manager.md
│   │   ├── architecht.md
│   │   ├── backend.md          (Engine Engineer)
│   │   ├── frontend.md
│   │   ├── devops.md
│   │   ├── qa.md
│   │   └── integrator.md
│   ├── context/
│   │   └── orchestrator.md
│   └── state/
│       └── agent-comms.md
├── src/
│   ├── main.ts
│   ├── engine/
│   ├── fractals/
│   ├── renderer/
│   ├── ui/
│   └── workers/
├── docs/
│   └── architecture/
├── .github/
│   └── workflows/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── README.md
```
