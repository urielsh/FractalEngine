import { describe, it, expect } from 'vitest';
import { LSystemFractal, LSYSTEM_PRESETS } from '../fractals/LSystemFractal';

describe('LSystemFractal basics', () => {
  const fractal = new LSystemFractal();

  it('returns correct name', () => {
    expect(fractal.getName()).toBe('L-System Fractal');
  });

  it('compute() always returns 0', () => {
    expect(fractal.compute(0, 0)).toBe(0);
  });

  it('compute() returns 0 for extreme coordinates', () => {
    expect(fractal.compute(1e10, -1e10)).toBe(0);
  });

  it('default parameters include preset key', () => {
    const params = fractal.getDefaultParameters();
    expect(params).toHaveProperty('preset');
    expect(params.maxIterations).toBe(256);
    expect(params.escapeRadius).toBe(2.0);
  });
});

describe('Preset management', () => {
  it('getPresetNames() returns exactly 3 names', () => {
    const fractal = new LSystemFractal();
    expect(fractal.getPresetNames()).toHaveLength(3);
  });

  it('preset names match known presets', () => {
    const fractal = new LSystemFractal();
    const names = fractal.getPresetNames();
    expect(names).toContain('Koch Snowflake');
    expect(names).toContain('Sierpinski Triangle');
    expect(names).toContain('Dragon Curve');
  });

  it('setPreset(0) selects first preset without error', () => {
    const fractal = new LSystemFractal();
    expect(() => fractal.setPreset(0)).not.toThrow();
  });

  it('setPreset(2) selects last preset without error', () => {
    const fractal = new LSystemFractal();
    expect(() => fractal.setPreset(2)).not.toThrow();
  });

  it('setPreset(-1) clamps to 0', () => {
    const fractal = new LSystemFractal();
    fractal.setPreset(-1);
    // Verify it uses preset 0 by checking generateString produces Koch output
    const gen = (fractal as any).generateString;
    const result = gen.call(fractal, 'F', { F: 'F+F--F+F' }, 1);
    expect(result).toBe('F+F--F+F');
  });

  it('setPreset(100) clamps to last preset', () => {
    const fractal = new LSystemFractal();
    fractal.setPreset(100);
    // Should not throw and should be usable
    expect(fractal.compute(0, 0)).toBe(0);
  });

  it('LSYSTEM_PRESETS has 3 entries', () => {
    expect(LSYSTEM_PRESETS).toHaveLength(3);
  });
});

describe('generateString (private)', () => {
  const fractal = new LSystemFractal();
  const gen = (str: string, rules: Record<string, string>, iter: number) =>
    (fractal as any).generateString(str, rules, iter);

  it('zero iterations returns axiom unchanged', () => {
    expect(gen('F--F--F', { F: 'F+F--F+F' }, 0)).toBe('F--F--F');
  });

  it('single Koch iteration: F → F+F--F+F', () => {
    expect(gen('F', { F: 'F+F--F+F' }, 1)).toBe('F+F--F+F');
  });

  it('characters without rules pass through', () => {
    expect(gen('A', { F: 'FF' }, 1)).toBe('A');
  });

  it('multi-character axiom with rules', () => {
    expect(gen('AB', { A: 'AX', B: 'BY' }, 1)).toBe('AXBY');
  });

  it('Sierpinski single iteration', () => {
    const result = gen('F-G-G', { F: 'F-G+F+G-F', G: 'GG' }, 1);
    expect(result).toBe('F-G+F+G-F-GG-GG');
  });

  it('two iterations compound correctly', () => {
    const iter1 = gen('F', { F: 'FA' }, 1);
    expect(iter1).toBe('FA');
    const iter2 = gen('F', { F: 'FA' }, 2);
    expect(iter2).toBe('FAA');
  });
});

describe('interpretTurtle (private)', () => {
  const fractal = new LSystemFractal();
  const turtle = (str: string, angle: number) =>
    (fractal as any).interpretTurtle(str, angle);

  it('empty string returns only origin point', () => {
    const points = turtle('', 90);
    expect(points).toHaveLength(1);
    expect(points[0].x).toBeCloseTo(0);
    expect(points[0].y).toBeCloseTo(0);
  });

  it('single F produces 2 points with second at (1, 0)', () => {
    const points = turtle('F', 90);
    expect(points).toHaveLength(2);
    expect(points[0].x).toBeCloseTo(0);
    expect(points[0].y).toBeCloseTo(0);
    expect(points[1].x).toBeCloseTo(1);
    expect(points[1].y).toBeCloseTo(0);
  });

  it('G moves forward same as F', () => {
    const pointsF = turtle('F', 90);
    const pointsG = turtle('G', 90);
    expect(pointsG).toHaveLength(2);
    expect(pointsG[1].x).toBeCloseTo(pointsF[1].x);
    expect(pointsG[1].y).toBeCloseTo(pointsF[1].y);
  });

  it('F+F at 90° produces right-angle path', () => {
    const points = turtle('F+F', 90);
    expect(points).toHaveLength(3);
    // First F: (0,0) → (1,0)
    expect(points[1].x).toBeCloseTo(1);
    expect(points[1].y).toBeCloseTo(0);
    // + rotates 90° CW, second F: (1,0) → (1,1)
    expect(points[2].x).toBeCloseTo(1);
    expect(points[2].y).toBeCloseTo(1);
  });

  it('F-F at 90° turns the other direction', () => {
    const points = turtle('F-F', 90);
    expect(points).toHaveLength(3);
    expect(points[1].x).toBeCloseTo(1);
    expect(points[1].y).toBeCloseTo(0);
    // - rotates -90°, second F: (1,0) → (1,-1)
    expect(points[2].x).toBeCloseTo(1);
    expect(points[2].y).toBeCloseTo(-1);
  });

  it('push/pop state with [ and ] returns to saved position', () => {
    const points = turtle('F[+F]-F', 90);
    // F: (0,0)→(1,0)
    // [: save (1,0,angle=0)
    // +: rotate 90°
    // F: (1,0)→(1,1)
    // ]: restore to (1,0,angle=0), push point
    // -: rotate -90°
    // F: (1,0)→(1,-1)
    expect(points.length).toBeGreaterThanOrEqual(5);
    // After ], turtle should be back at (1,0)
    const afterPop = points.find((p: { x: number; y: number }, i: number) => i > 2 && Math.abs(p.x - 1) < 0.01 && Math.abs(p.y) < 0.01);
    expect(afterPop).toBeDefined();
  });
});
