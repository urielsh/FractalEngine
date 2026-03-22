# FractalEngine

A real-time interactive 3D fractal generator built with TypeScript and Three.js. Explore complex mathematical fractals with beautiful rendering, real-time zoom, and interactive controls.

## Features

- **Multiple Fractal Types**
  - Mandelbrot Set
  - Julia Set
  - Burning Ship
  - Newton Fractals
  - L-System Fractals

- **Interactive Real-time Exploration**
  - Zoom in/out smoothly
  - Pan across the fractal landscape
  - Adjust iteration depth and escape radius
  - Real-time parameter tuning

- **High-Quality Rendering**
  - WebGL-accelerated rendering using Three.js
  - Configurable resolution and quality
  - Smooth color gradients using HSL color space
  - Efficient tile-based computation

- **Export Capabilities**
  - Export current view as high-resolution image
  - Generate animations and sequences

- **Parallel Computation**
  - Web Worker support for non-blocking calculations
  - Multi-threaded fractal generation

## Project Structure

```
FractalEngine/
├── src/
│   ├── main.ts                 # Application entry point
│   ├── fractals/
│   │   └── index.ts           # Fractal implementations
│   ├── engine/
│   │   └── FractalEngine.ts    # Core fractal computation engine
│   ├── renderer/
│   │   └── FractalRenderer.ts  # Three.js rendering system
│   ├── ui/
│   │   └── UIController.ts     # Interactive UI controls
│   └── workers/                # Web Workers (future)
├── index.html                  # HTML entry point
├── vite.config.ts             # Vite build configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Building

Create a production build:

```bash
npm run build
```

Output will be in the `dist/` directory.

### Type Checking

Verify TypeScript types:

```bash
npm run type-check
```

## Usage

### Basic Navigation

1. **Select Fractal Type**: Choose from the dropdown menu
2. **Zoom**: Use the zoom slider to magnify the fractal
3. **Pan**: Adjust Center X and Y to move around
4. **Parameters**:
   - Max Iterations: Higher = more detail (slower)
   - Escape Radius: Affects fractal boundary

### Keyboard Shortcuts (Coming Soon)

- `+` / `-`: Zoom in/out
- Arrow Keys: Pan around
- `R`: Reset view

### Exporting

Click "Export as Image" to download the current view as a PNG image.

## Core Classes

### FractalEngine
Manages fractal computations and parameter handling.

```typescript
const engine = new FractalEngine();
engine.setFractalType('mandelbrot');
engine.setParameter('maxIterations', 512);
const data = engine.generateFractalData(width, height, centerX, centerY, zoom);
```

### FractalRenderer
Handles Three.js rendering to canvas texture.

```typescript
const renderer = new FractalRenderer(scene, threeRenderer);
renderer.renderFractal(engine, centerX, centerY, zoom);
```

### UIController
Manages interactive controls and user input.

```typescript
const ui = new UIController(engine, renderer);
```

## Architecture

### Computation Pipeline

1. **Input Parameters**: User sets zoom, center, iteration count via UI
2. **Data Generation**: FractalEngine computes pixel data using selected fractal type
3. **Color Mapping**: HSL color space for smooth gradients
4. **Texture Rendering**: Canvas texture updates and renders via Three.js

### Fractal Types

#### Mandelbrot Set
Classic fractal defined by the iteration: `z_{n+1} = z_n^2 + c`

#### Julia Set
Similar to Mandelbrot but with fixed complex parameter `c`

#### Burning Ship
Variation using absolute values: `z_{n+1} = |Re(z_n)|^2 - |Im(z_n)|^2 + c`

#### Newton Fractal
Based on Newton's method for finding roots of `z^3 - 1 = 0`

#### L-System Fractals
Plant-like fractals generated through string rewriting rules

## Performance Tips

1. **Reduce Max Iterations** for faster real-time updates during exploration
2. **Lower Resolution** while adjusting zoom, increase for final renders
3. **Use Web Workers** (coming soon) for non-blocking computation of very large renders

## Future Enhancements

- [ ] Web Worker support for parallel computation
- [ ] Keyboard shortcuts for navigation
- [ ] Animation recording and playback
- [ ] Custom color schemes and palettes
- [ ] Deeper L-System rule configuration
- [ ] WebGL-optimized fractal computation
- [ ] Persistent state saving/loading
- [ ] Multi-threaded tile-based rendering
- [ ] Advanced export options (video, high-res)

## Browser Compatibility

- Chrome/Chromium 90+
- Firefox 88+
- Safari 15+
- Edge 90+

## Dependencies

- **three**: 3D graphics library
- **vite**: Build tool and dev server
- **typescript**: Type safety

## Development

### Adding a New Fractal Type

1. Create a new class extending `Fractal` in `src/fractals/index.ts`
2. Implement `compute()` and `getName()` methods
3. Register in `FractalEngine` constructor
4. Add to UI dropdown

### Building for Production

The build process:
1. Compiles TypeScript to JavaScript
2. Bundles with Vite
3. Optimizes assets
4. Outputs to `dist/`

Deploy the `dist/` folder to any static hosting service.

## License

MIT License - See LICENSE file for details

## Contributing

Contributions welcome! Please ensure:
- TypeScript types are correct (`npm run type-check`)
- Code builds successfully (`npm run build`)
- New features include documentation

## Support

For issues, questions, or suggestions, please open an issue on the GitHub repository.

---

Made with ❤️ for mathematics and interactive visualization
