import { Fractal, FractalParameters } from './Fractal';
import { LSYSTEM_MARGIN_PX } from '../constants';

// L-System presets
export interface LSystemPreset {
  name: string;
  axiom: string;
  rules: Record<string, string>;
  angle: number;
  iterations: number;
}

export const LSYSTEM_PRESETS: LSystemPreset[] = [
  {
    name: 'Koch Snowflake',
    axiom: 'F--F--F',
    rules: { F: 'F+F--F+F' },
    angle: 60,
    iterations: 4,
  },
  {
    name: 'Sierpinski Triangle',
    axiom: 'F-G-G',
    rules: { F: 'F-G+F+G-F', G: 'GG' },
    angle: 120,
    iterations: 6,
  },
  {
    name: 'Dragon Curve',
    axiom: 'FX',
    rules: { X: 'X+YF+', Y: '-FX-Y' },
    angle: 90,
    iterations: 12,
  },
];

export class LSystemFractal extends Fractal {
  private presetIndex: number = 0;

  getName(): string {
    return 'L-System Fractal';
  }

  getDefaultParameters(): FractalParameters {
    return {
      maxIterations: 256,
      escapeRadius: 2.0,
      preset: 0,
    };
  }

  setPreset(index: number): void {
    this.presetIndex = Math.max(0, Math.min(index, LSYSTEM_PRESETS.length - 1));
  }

  getPresetNames(): string[] {
    return LSYSTEM_PRESETS.map(p => p.name);
  }

  compute(_x: number, _y: number): number {
    return 0; // L-Systems use renderToCanvas instead
  }

  renderToCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
    const preset = LSYSTEM_PRESETS[this.presetIndex];
    const lString = this.generateString(preset.axiom, preset.rules, preset.iterations);
    const points = this.interpretTurtle(lString, preset.angle);

    if (points.length === 0) return true;

    // Compute bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }

    const bboxW = maxX - minX || 1;
    const bboxH = maxY - minY || 1;
    const margin = LSYSTEM_MARGIN_PX;
    const scale = Math.min((width - 2 * margin) / bboxW, (height - 2 * margin) / bboxH);
    const offsetX = (width - bboxW * scale) / 2 - minX * scale;
    const offsetY = (height - bboxH * scale) / 2 - minY * scale;

    // Clear and draw
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 1;
    ctx.beginPath();

    let penDown = true;
    for (let i = 0; i < points.length; i++) {
      const sx = points[i].x * scale + offsetX;
      const sy = points[i].y * scale + offsetY;
      if (i === 0 || !penDown) {
        ctx.moveTo(sx, sy);
        penDown = true;
      } else {
        ctx.lineTo(sx, sy);
      }
    }
    ctx.stroke();

    return true;
  }

  private generateString(axiom: string, rules: Record<string, string>, iterations: number): string {
    let current = axiom;
    for (let i = 0; i < iterations; i++) {
      let next = '';
      for (const ch of current) {
        next += rules[ch] ?? ch;
      }
      current = next;
    }
    return current;
  }

  private interpretTurtle(lString: string, angleDeg: number): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    let x = 0, y = 0;
    let angle = 0;
    const angleRad = (angleDeg * Math.PI) / 180;
    const stack: { x: number; y: number; angle: number }[] = [];

    points.push({ x, y });

    for (const ch of lString) {
      switch (ch) {
        case 'F':
        case 'G':
          x += Math.cos(angle);
          y += Math.sin(angle);
          points.push({ x, y });
          break;
        case '+':
          angle += angleRad;
          break;
        case '-':
          angle -= angleRad;
          break;
        case '[':
          stack.push({ x, y, angle });
          break;
        case ']':
          if (stack.length > 0) {
            const state = stack.pop()!;
            x = state.x;
            y = state.y;
            angle = state.angle;
            points.push({ x, y }); // Move without drawing is handled by pen logic
          }
          break;
      }
    }

    return points;
  }
}
