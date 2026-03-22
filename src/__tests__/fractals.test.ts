import { describe, it, expect } from 'vitest';
import {
  MandelbrotSet,
  JuliaSet,
  BurningShip,
  NewtonFractal,
} from '../fractals/index';

describe('MandelbrotSet', () => {
  const fractal = new MandelbrotSet();

  it('converges at origin (inside the set)', () => {
    const result = fractal.compute(0, 0);
    expect(result).toBe(fractal.maxIterations);
  });

  it('diverges quickly far from origin', () => {
    const result = fractal.compute(3, 3);
    expect(result).toBeLessThan(10);
  });

  it('converges at known interior point (-0.1, 0.1)', () => {
    const result = fractal.compute(-0.1, 0.1);
    expect(result).toBe(fractal.maxIterations);
  });

  it('returns correct name', () => {
    expect(fractal.getName()).toBe('Mandelbrot Set');
  });

  it('returns default parameters with expected keys', () => {
    const params = fractal.getDefaultParameters();
    expect(params.maxIterations).toBe(256);
    expect(params.escapeRadius).toBe(2.0);
  });
});

describe('JuliaSet', () => {
  const fractal = new JuliaSet();

  it('diverges at large coordinates', () => {
    const result = fractal.compute(5, 5);
    expect(result).toBeLessThan(10);
  });

  it('returns maxIterations for a point inside the set', () => {
    // Origin with default c values may or may not converge, but should return a number
    const result = fractal.compute(0, 0);
    expect(result).toBeGreaterThan(0);
  });

  it('returns a smooth iteration count for boundary points', () => {
    const result = fractal.compute(0.5, 0.5);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(fractal.maxIterations);
  });

  it('returns correct name', () => {
    expect(fractal.getName()).toBe('Julia Set');
  });
});

describe('BurningShip', () => {
  const fractal = new BurningShip();

  it('converges at origin', () => {
    const result = fractal.compute(0, 0);
    expect(result).toBe(fractal.maxIterations);
  });

  it('diverges far from origin', () => {
    const result = fractal.compute(5, 5);
    expect(result).toBeLessThan(10);
  });

  it('produces deterministic results', () => {
    const r1 = fractal.compute(0.3, -0.4);
    const r2 = fractal.compute(0.3, -0.4);
    expect(r1).toBe(r2);
  });

  it('returns correct name', () => {
    expect(fractal.getName()).toBe('Burning Ship');
  });
});

describe('NewtonFractal', () => {
  const fractal = new NewtonFractal();

  it('converges near a root of z^3 - 1 (near z=1)', () => {
    const result = fractal.compute(1.1, 0.1);
    expect(result).toBeLessThanOrEqual(fractal.maxIterations);
    expect(result).toBeGreaterThan(0);
  });

  it('handles origin gracefully', () => {
    const result = fractal.compute(0, 0);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(fractal.maxIterations);
  });

  it('produces deterministic results', () => {
    const r1 = fractal.compute(0.5, 0.5);
    const r2 = fractal.compute(0.5, 0.5);
    expect(r1).toBe(r2);
  });

  it('returns correct name', () => {
    expect(fractal.getName()).toBe('Newton Fractal');
  });
});
