import { describe, it, expect } from 'vitest';
import {
  computeMandelbrot,
  computeJulia,
  computeBurningShip,
  computeNewton,
  computePoint,
} from '../fractals/compute';

describe('computeMandelbrot', () => {
  const maxIter = 256;
  const escape = 2.0;

  it('returns maxIterations for origin (interior point)', () => {
    expect(computeMandelbrot(0, 0, maxIter, escape)).toBe(maxIter);
  });

  it('diverges quickly far from origin', () => {
    expect(computeMandelbrot(3, 3, maxIter, escape)).toBeLessThan(10);
  });

  it('returns smooth (fractional) iteration count at boundary', () => {
    // Point near the Mandelbrot boundary that escapes
    const result = computeMandelbrot(-0.75, 0.2, maxIter, escape);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(maxIter);
    expect(result % 1).not.toBe(0); // fractional due to smooth coloring
  });

  it('is deterministic', () => {
    const r1 = computeMandelbrot(0.3, 0.5, maxIter, escape);
    const r2 = computeMandelbrot(0.3, 0.5, maxIter, escape);
    expect(r1).toBe(r2);
  });

  it('returns 0 when maxIterations is 0', () => {
    expect(computeMandelbrot(0, 0, 0, escape)).toBe(0);
  });

  it('handles maxIterations of 1 without error', () => {
    const result = computeMandelbrot(0, 0, 1, escape);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });

  it('escapeRadius affects the result', () => {
    const withDefault = computeMandelbrot(0.3, 0.6, maxIter, 2.0);
    const withLarge = computeMandelbrot(0.3, 0.6, maxIter, 10.0);
    // Different escape radii produce different iteration counts
    expect(withDefault).not.toBe(withLarge);
  });

  it('handles negative coordinates', () => {
    const result = computeMandelbrot(-2, -2, maxIter, escape);
    // (-2,-2) is outside the set and diverges; smooth coloring may produce fractional values
    expect(result).toBeLessThan(maxIter);
    expect(typeof result).toBe('number');
    expect(Number.isFinite(result)).toBe(true);
  });
});

describe('computeJulia', () => {
  const maxIter = 256;
  const escape = 2.0;
  const cReal = -0.7;
  const cImag = 0.27015;

  it('diverges at large coordinates', () => {
    expect(computeJulia(10, 10, maxIter, escape, cReal, cImag)).toBeLessThan(10);
  });

  it('returns a valid result at origin', () => {
    const result = computeJulia(0, 0, maxIter, escape, cReal, cImag);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(maxIter);
  });

  it('different c values change the output', () => {
    const r1 = computeJulia(0.3, 0.3, maxIter, escape, -0.7, 0.27015);
    const r2 = computeJulia(0.3, 0.3, maxIter, escape, 0.355, 0.355);
    expect(r1).not.toBe(r2);
  });

  it('returns maxIterations when maxIterations is 0', () => {
    expect(computeJulia(0, 0, 0, escape, cReal, cImag)).toBe(0);
  });
});

describe('computeBurningShip', () => {
  const maxIter = 256;
  const escape = 2.0;

  it('returns maxIterations for origin', () => {
    expect(computeBurningShip(0, 0, maxIter, escape)).toBe(maxIter);
  });

  it('diverges far from origin', () => {
    expect(computeBurningShip(5, 5, maxIter, escape)).toBeLessThan(10);
  });

  it('is deterministic', () => {
    const r1 = computeBurningShip(0.3, -0.4, maxIter, escape);
    const r2 = computeBurningShip(0.3, -0.4, maxIter, escape);
    expect(r1).toBe(r2);
  });
});

describe('computeNewton', () => {
  const maxIter = 256;

  it('converges quickly near root z=1', () => {
    // Point slightly off the root to trigger Newton convergence
    const result = computeNewton(1.1, 0.1, maxIter);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(maxIter);
  });

  it('returns 0 at origin (r2 < 0.001)', () => {
    expect(computeNewton(0, 0, maxIter)).toBe(0);
  });

  it('returns a valid value for points far from roots', () => {
    const result = computeNewton(5, 5, maxIter);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(maxIter);
  });

  it('returns maxIterations when maxIterations is 0', () => {
    expect(computeNewton(1.0, 0.0, 0)).toBe(0);
  });
});

describe('computePoint dispatcher', () => {
  const x = 0.3;
  const y = 0.5;
  const maxIter = 256;
  const escape = 2.0;

  it('dispatches to computeMandelbrot', () => {
    const direct = computeMandelbrot(x, y, maxIter, escape);
    const dispatched = computePoint(x, y, { fractalType: 'mandelbrot', maxIterations: maxIter, escapeRadius: escape });
    expect(dispatched).toBe(direct);
  });

  it('dispatches to computeJulia with default c values', () => {
    const direct = computeJulia(x, y, maxIter, escape, -0.7, 0.27015);
    const dispatched = computePoint(x, y, { fractalType: 'julia', maxIterations: maxIter, escapeRadius: escape });
    expect(dispatched).toBe(direct);
  });

  it('dispatches to computeJulia with explicit c values', () => {
    const cReal = 0.355;
    const cImag = 0.355;
    const direct = computeJulia(x, y, maxIter, escape, cReal, cImag);
    const dispatched = computePoint(x, y, { fractalType: 'julia', maxIterations: maxIter, escapeRadius: escape, cReal, cImag });
    expect(dispatched).toBe(direct);
  });

  it('dispatches to computeBurningShip', () => {
    const direct = computeBurningShip(x, y, maxIter, escape);
    const dispatched = computePoint(x, y, { fractalType: 'burningship', maxIterations: maxIter, escapeRadius: escape });
    expect(dispatched).toBe(direct);
  });

  it('dispatches to computeNewton', () => {
    const direct = computeNewton(x, y, maxIter);
    const dispatched = computePoint(x, y, { fractalType: 'newton', maxIterations: maxIter, escapeRadius: escape });
    expect(dispatched).toBe(direct);
  });

  it('returns 0 for lsystem', () => {
    expect(computePoint(x, y, { fractalType: 'lsystem', maxIterations: maxIter, escapeRadius: escape })).toBe(0);
  });

  it('returns 0 for unknown fractal type', () => {
    expect(computePoint(x, y, { fractalType: 'unknown' as any, maxIterations: maxIter, escapeRadius: escape })).toBe(0);
  });
});
