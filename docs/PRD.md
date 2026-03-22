# FractalEngine — Product Requirements Document

## 1. PRD Summary

**Product Name:** FractalEngine
**Version:** 1.0.0
**Type:** Web application (single-page, client-side)

**Vision:** A real-time interactive fractal generator that empowers mathematically curious users and digital artists to explore, customize, and export beautiful fractal visualizations — directly in the browser, with no installation required.

**Target Users:**

- Students and math enthusiasts exploring complex dynamics
- Digital artists creating fractal-based visuals
- Educators demonstrating mathematical concepts
- Developers learning about WebGL, Web Workers, and computational graphics

**Tech Stack:**

- **Language:** TypeScript (strict mode, ES2020 target)
- **3D Rendering:** Three.js (WebGL-accelerated, CanvasTexture on PlaneGeometry)
- **Build:** Vite 5, TypeScript 5
- **Testing:** Vitest
- **Parallelism:** Web Workers with tile-based progressive rendering
- **Runtime Dependencies:** three (sole production dependency)

**Browser Support:** Chrome 90+, Firefox 88+, Safari 15+, Edge 90+

---

## 2. Current Features (Implemented — Phase 1 + Phase 2)

### 2.1 Fractal Types

| Fractal | Algorithm | Rendering Path |
| --- | --- | --- |
| **Mandelbrot Set** | z(n+1) = z(n)^2 + c, smooth iteration counting | Per-pixel (CPU/Worker) |
| **Julia Set** | Fixed c parameter (-0.7, 0.27015), same iteration | Per-pixel (CPU/Worker) |
| **Burning Ship** | Absolute-value variant of Mandelbrot | Per-pixel (CPU/Worker) |
| **Newton Fractal** | Newton's method for z^3 - 1 = 0 | Per-pixel (CPU/Worker) |
| **L-System Fractal** | String rewriting + turtle graphics | Geometry-based (Canvas 2D) |

L-System presets: Koch Snowflake, Sierpinski Triangle, Dragon Curve.

### 2.2 Rendering Pipeline

1. User adjusts parameters via UI controls
2. `FractalEngine` coordinates computation parameters
3. **Per-pixel fractals:** Canvas split into 96px horizontal tiles, dispatched to Web Worker pool (N = `navigator.hardwareConcurrency`, default 4)
4. Workers compute each tile independently, return `Uint8Array` RGBA data via `postMessage` with transferable buffers
5. Tiles are progressively applied to an internal `<canvas>` element
6. Canvas wrapped in Three.js `CanvasTexture` on a `PlaneGeometry(2, 1.5)`, rendered by `WebGLRenderer`
7. **L-Systems:** Bypass the pixel pipeline entirely; render turtle-graphics geometry directly to canvas via `renderToCanvas()`
8. **Fallback:** If Web Workers are unavailable, computation runs on the main thread

### 2.3 Color System

5 built-in color schemes, each mapping iteration count to RGB:

| Scheme | Description |
| --- | --- |
| **Classic HSL** | Full 360-degree hue cycle, 100% saturation, 50% lightness |
| **Fire** | Black to red to yellow to white gradient |
| **Ocean** | Dark blue to cyan to light blue |
| **Grayscale** | Linear black-to-white |
| **Neon** | Vibrant cyan-magenta-purple HSL cycle (60% lightness) |

All schemes render converged points (iterations >= maxIterations) as black.

### 2.4 Interactive Controls

**UI Panel** (350px right sidebar, dark theme with cyan accents):

- Fractal type dropdown (5 types)
- Color scheme dropdown (5 schemes)
- Center X / Center Y number inputs (step 0.01)
- Zoom slider (0.1x - 10x)
- Max Iterations input (10 - 1000)
- Escape Radius input (1.0 - 10.0)
- Render / Export / Reset buttons
- Keyboard shortcuts reference

**Keyboard Shortcuts:**

| Key | Action |
| --- | --- |
| `+` / `=` | Zoom in 10% |
| `-` | Zoom out 10% |
| Arrow keys | Pan (0.1 units, scaled by zoom) |
| `R` | Reset to default view |

Shortcuts are suppressed when a text input or select is focused.

### 2.5 Export

PNG image export via canvas `toBlob()`. File naming: `fractal-{type}-{timestamp}.png`.

### 2.6 Responsive Layout

- Canvas fills `(window.innerWidth - 350) x window.innerHeight`
- Window resize triggers debounced (300ms) resolution update and re-render
- Three.js camera aspect ratio updates on resize

### 2.7 Testing

- **Framework:** Vitest (26 passing tests)
- **Fractal tests** (`src/__tests__/fractals.test.ts`): convergence, divergence, boundary, determinism, naming for each fractal type
- **Engine tests** (`src/__tests__/engine.test.ts`): initialization, type switching, case insensitivity, invalid types, parameter get/set, data generation

---

## 3. Planned Features

### Phase 3: Creative Controls

#### 3.1 Enhanced Color Controls

**Color Parameter Sliders** — fine-tune any preset palette:

- Hue Offset (0-360 degrees)
- Saturation (0-200%, 100% = default)
- Brightness (0-200%)
- Contrast (0-200%)
- Cycle Speed (0.1x - 5.0x, controls how fast colors cycle through iterations)

**Custom Gradient Editor** — build a palette from scratch:

- 2-4 user-defined color stops, each with a color picker and position slider (0-100%)
- Linear interpolation between stops
- Add/Remove stop buttons
- Replaces preset scheme when active

#### 3.2 Shape Boundaries

Render fractals within geometric boundaries instead of the full rectangular canvas.

**Basic Shapes** (with proportion controls):

| Shape | Controls |
| --- | --- |
| Oval | Aspect ratio (0.2 - 5.0) |
| Triangle | Aspect ratio, roundness (0.0 - 1.0) for vertex beveling |
| Rectangle | Aspect ratio, roundness (0.0 - 1.0) for corner rounding |

**Chess Piece Silhouettes** (all 6 pieces):

| Piece | Geometry Approach |
| --- | --- |
| Pawn | SDF: stacked circles + base rectangle |
| Rook | SDF: rectangle body + 3 crenellations |
| Bishop | SDF: tapered body + pointed top + mitre ball circle |
| Knight | Polygon silhouette (~20 vertices, winding-number test) |
| Queen | SDF: tapered body + 5 triangular crown points |
| King | SDF: similar to queen + cross (union of 2 rectangles) |

**Boundary Modes** (user toggle):

- **Mask:** Fractal renders normally, clipped to shape — outside pixels are black
- **Distortion:** Fractal coordinate space is warped to fill the shape via polar radial remapping with a precomputed LUT (720 angle samples at 0.5-degree resolution)

### Phase 4: Future Enhancements

- WebGL shader computation (GPU-accelerated fractals)
- Animation recording and playback with keyframed zoom sequences
- Persistent state save/load (localStorage + shareable URL hash)
- High-resolution export (4K / 8K)
- Video export (MP4 via MediaRecorder API)
- E2E testing (Playwright)
- Deeper L-System rule configuration (custom axioms, rules, angles)

---

## 4. User Stories

### Implemented (Phase 1 + 2)

**US-01:** As a fractal explorer, I want to choose from multiple fractal types, so I can explore different mathematical sets.

**US-02:** As a fractal explorer, I want to zoom and pan the fractal in real-time, so I can navigate to interesting regions.

**US-03:** As a user, I want computation to happen off the main thread, so the UI stays responsive during rendering.

**US-04:** As a digital artist, I want to choose from multiple color palettes, so I can create visually distinct images.

**US-05:** As a power user, I want keyboard shortcuts for zoom, pan, and reset, so I can navigate without the mouse.

**US-06:** As a user, I want to export the current view as a PNG, so I can save and share it.

**US-07:** As a fractal enthusiast, I want real L-System fractals (Koch, Sierpinski, Dragon), so the tool covers the full range of advertised types.

**US-08:** As a user on different screen sizes, I want the canvas to adapt to my viewport.

### Planned (Phase 3)

**US-09:** As a digital artist, I want fine-grained color controls (hue, saturation, brightness, contrast, cycle speed), so I can customize any palette to my taste.

**US-10:** As a creative user, I want to build a custom gradient from 2-4 color stops, so I have full control over the color mapping.

**US-11:** As a user, I want to render fractals clipped to geometric shapes (oval, triangle, rectangle), so I can create shaped fractal art.

**US-12:** As a user, I want to control shape proportions (aspect ratio, roundness), so the boundary matches my vision.

**US-13:** As a creative user, I want to render fractals inside chess piece silhouettes (all 6 pieces), so I can create unique themed artwork.

**US-14:** As a user, I want to choose between mask mode and distortion mode for shape boundaries, so I can either clip or warp the fractal to the shape.

---

## 5. Acceptance Criteria

### US-01: Fractal Type Selection

- GIVEN the control panel, WHEN the user selects a fractal type from the dropdown, THEN the fractal re-renders with the selected type
- GIVEN each of the 5 fractal types, THEN each produces a visually distinct, deterministic output

### US-03: Web Worker Computation

- GIVEN a render starts, THEN UI controls remain interactive (no frame drops below 30fps)
- GIVEN a render in progress, WHEN parameters change, THEN the in-flight computation is cancelled and a new one starts
- GIVEN the browser doesn't support Workers, THEN the system falls back to main-thread computation with a console warning

### US-04: Color Scheme Selection

- GIVEN the control panel, WHEN the user selects a color scheme, THEN the fractal re-renders with that palette
- GIVEN 5 built-in schemes exist, THEN each produces visually distinct output
- GIVEN export, THEN the exported image uses the active color scheme

### US-06: Image Export

- GIVEN a rendered fractal, WHEN "Export as Image" is clicked, THEN a PNG file downloads
- GIVEN the export, THEN the filename follows `fractal-{type}-{timestamp}.png`

### US-07: L-System Fractals

- GIVEN "L-System" is selected, THEN a deterministic pattern displays (not random noise)
- GIVEN the L-System fractal, THEN 3 presets are available (Koch, Sierpinski, Dragon)

### US-09: Color Parameter Sliders

- GIVEN any preset scheme, WHEN the user adjusts a color slider, THEN the fractal re-renders with the modified palette in real-time
- GIVEN hue offset is set to 180, THEN colors shift by 180 degrees from the base scheme
- GIVEN all sliders at default (100% / 0 offset / 1.0x speed), THEN the output is identical to the unmodified preset

### US-10: Custom Gradient

- GIVEN "Custom Gradient" is enabled, WHEN the user defines 3 color stops, THEN the fractal renders with a smooth gradient interpolated between those stops
- GIVEN the gradient editor, THEN users can add (max 4) and remove (min 2) stops

### US-11: Shape Boundaries — Basic Shapes

- GIVEN oval shape + mask mode, THEN the fractal is clipped to an ellipse and outside pixels are black
- GIVEN triangle shape + distortion mode, THEN the fractal coordinate space is warped to fill a triangle
- GIVEN shape = "none", THEN the fractal renders to the full rectangular canvas (default)

### US-13: Chess Piece Boundaries

- GIVEN any chess piece selected + mask mode, THEN the fractal is clipped to a recognizable piece silhouette
- GIVEN the knight piece, THEN the horse-head shape is clearly recognizable
- GIVEN all 6 pieces, THEN each produces a distinct, recognizable silhouette

### US-14: Boundary Mode Toggle

- GIVEN mask mode, THEN pixels outside the shape are black and fractal computation is skipped (performance gain)
- GIVEN distortion mode, THEN the fractal is warped to fill the shape boundary via polar remapping

---

## 6. Phase Delineation

### Phase 1 — MVP (Complete)

App skeleton, 5 fractal types (L-System placeholder), Three.js rendering, basic UI controls, dark theme.

### Phase 2 — Reliability & Responsiveness (Complete)

Web Workers with tile-based rendering, 5 color scheme presets, keyboard shortcuts, working PNG export, proper L-System implementation (3 presets with turtle graphics), responsive canvas, Vitest test suite (26 tests).

### Phase 3 — Creative Controls (Next)

Enhanced color controls (parameter sliders + custom gradient editor), shape boundary system (3 basic shapes + 6 chess pieces), mask and distortion modes, collapsible UI sections, unit tests for color mapping and shape boundaries.

### Phase 4 — Power & Creativity (Future)

WebGL shader computation, animation recording/playback, persistent state, high-res and video export, E2E tests, advanced L-System configuration.

---

## 7. Architecture Overview

### Module Responsibilities

```
src/
  main.ts                    → App bootstrap, Three.js scene, resize handling
  engine/
    FractalEngine.ts         → Central coordinator: fractal registry, parameters,
                               color scheme, data generation, worker param packaging
  fractals/
    index.ts                 → Abstract Fractal class + 5 implementations
                               (Mandelbrot, Julia, BurningShip, Newton, LSystem)
    compute.ts               → Pure computation functions (worker-compatible,
                               no class dependencies)
  renderer/
    FractalRenderer.ts       → Three.js rendering: canvas texture, tile application,
                               worker pool, L-System rendering path delegation
  workers/
    fractal.worker.ts        → Web Worker: receives TileTask, computes pixel data,
                               returns TileResult with transferable buffer
    WorkerPool.ts            → Manages N workers, task queue, cancellation,
                               progressive dispatch
  colors/
    ColorScheme.ts           → ColorScheme interface, 5 preset implementations,
                               hslToRgb helper
  ui/
    UIController.ts          → All UI controls, event listeners, keyboard shortcuts,
                               export, state synchronization
  __tests__/
    fractals.test.ts         → Unit tests for fractal computation
    engine.test.ts           → Unit tests for engine behavior
```

### Rendering Pipeline Flow

```
User Input (UI / Keyboard)
    │
    ▼
UIController → FractalEngine.setFractalType() / setParameter() / setColorScheme()
    │
    ▼
UIController.render()
    │
    ▼
FractalRenderer.renderFractal(engine, centerX, centerY, zoom)
    │
    ├─ L-System? ──▶ fractal.renderToCanvas(ctx, w, h) ──▶ texture.needsUpdate = true
    │
    ├─ Workers available? ──▶ Split into TileTasks (96px strips)
    │       │                       │
    │       │                       ▼
    │       │               WorkerPool.processTiles()
    │       │                       │
    │       │                       ▼
    │       │               fractal.worker.ts (per tile):
    │       │                 normalize coords → apply zoom/pan
    │       │                 → computePoint() → mapColor() → Uint8Array
    │       │                       │
    │       │                       ▼
    │       │               applyTile() → ctx.putImageData() → texture.needsUpdate
    │       │
    │       └─ No workers ──▶ FractalEngine.generateFractalData() (main thread)
    │                               │
    │                               ▼
    │                       ctx.putImageData() → texture.needsUpdate = true
    │
    ▼
Three.js animation loop: renderer.render(scene, camera) → WebGL display
```

### Key Interfaces

```typescript
// Fractal computation (worker-compatible)
interface ComputeParams {
  fractalType: 'mandelbrot' | 'julia' | 'burningship' | 'newton' | 'lsystem';
  maxIterations: number;
  escapeRadius: number;
  cReal?: number;   // Julia set only
  cImag?: number;   // Julia set only
}

// Worker communication
interface TileTask {
  id: number;
  width: number; height: number;
  startY: number; endY: number;
  centerX: number; centerY: number; zoom: number;
  computeParams: ComputeParams;
  colorSchemeName: string;
}

interface TileResult {
  id: number;
  startY: number; endY: number;
  data: Uint8Array;  // RGBA, transferred via postMessage
}

// Color mapping
interface ColorScheme {
  name: string;
  map(iterations: number, maxIterations: number): { r: number; g: number; b: number };
}
```

---

## 8. Technical Constraints

1. **Worker serialization:** Web Workers cannot share class instances or closures. All data passed via `postMessage` must be serializable (plain objects, typed arrays). Fractal computation is extracted into pure functions (`compute.ts`) for this reason.

2. **Color duplication:** Color mapping is currently duplicated between `ColorScheme.ts` (main thread) and `fractal.worker.ts` (worker). Phase 3 will consolidate this into a shared `colorMapping.ts` module of pure functions.

3. **L-System rendering path:** L-Systems produce line geometry, not per-pixel iteration counts. They bypass the worker pipeline and render directly to canvas via `Fractal.renderToCanvas()`. Shape boundaries will need special handling for L-Systems.

4. **Canvas texture updates:** Each tile completion triggers `texture.needsUpdate = true`. Three.js uploads the texture to GPU on the next frame. High tile frequency could cause excessive uploads — currently mitigated by 96px tile height (8-10 tiles for typical canvas).

5. **No external state:** All state lives in `FractalEngine` (computation params) and `UIController` (view state). No localStorage, URL state, or external services.

6. **Single production dependency:** Only `three` at runtime. Build tooling (vite, typescript, vitest) is dev-only.

---

## 9. File Map

| File | Lines | Role |
| --- | --- | --- |
| `src/main.ts` | 48 | App entry, Three.js setup, resize |
| `src/engine/FractalEngine.ts` | 134 | Engine coordinator |
| `src/fractals/index.ts` | 333 | Fractal implementations |
| `src/fractals/compute.ts` | 121 | Pure computation functions |
| `src/renderer/FractalRenderer.ts` | 134 | Three.js rendering + tiles |
| `src/workers/fractal.worker.ts` | 103 | Tile computation worker |
| `src/workers/WorkerPool.ts` | 80 | Worker pool manager |
| `src/colors/ColorScheme.ts` | 89 | Color scheme interface + presets |
| `src/ui/UIController.ts` | 234 | UI controls + keyboard |
| `index.html` | 91 | Layout + CSS |
| `src/__tests__/fractals.test.ts` | ~100 | Fractal unit tests |
| `src/__tests__/engine.test.ts` | ~60 | Engine unit tests |
| `vitest.config.ts` | 13 | Test config |
| `vite.config.ts` | 16 | Build config |
| `tsconfig.json` | 32 | TypeScript config |
| `package.json` | 24 | Dependencies + scripts |

**Scripts:**

- `npm run dev` — Start dev server (localhost:3000)
- `npm run build` — TypeScript check + Vite production build
- `npm run type-check` — TypeScript validation only
- `npm test` — Run Vitest (26 tests)
- `npm run test:watch` — Vitest in watch mode
