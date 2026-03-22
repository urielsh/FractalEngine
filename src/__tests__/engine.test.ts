import { describe, it, expect } from 'vitest';
import { FractalEngine } from '../engine/FractalEngine';

describe('FractalEngine', () => {
  it('initializes with Mandelbrot as default', () => {
    const engine = new FractalEngine();
    expect(engine.getCurrentFractal().getName()).toBe('Mandelbrot Set');
  });

  it('switches fractal type', () => {
    const engine = new FractalEngine();
    engine.setFractalType('julia');
    expect(engine.getCurrentFractal().getName()).toBe('Julia Set');
  });

  it('handles case-insensitive fractal names', () => {
    const engine = new FractalEngine();
    engine.setFractalType('BurningShip');
    expect(engine.getCurrentFractal().getName()).toBe('Burning Ship');
  });

  it('ignores invalid fractal type', () => {
    const engine = new FractalEngine();
    engine.setFractalType('nonexistent');
    expect(engine.getCurrentFractal().getName()).toBe('Mandelbrot Set');
  });

  it('sets and gets parameters', () => {
    const engine = new FractalEngine();
    engine.setParameter('maxIterations', 512);
    expect(engine.getParameters().maxIterations).toBe(512);
  });

  it('resets parameters when switching fractal type', () => {
    const engine = new FractalEngine();
    engine.setParameter('maxIterations', 512);
    engine.setFractalType('julia');
    expect(engine.getParameters().maxIterations).toBe(256);
  });

  it('computes fractal values', () => {
    const engine = new FractalEngine();
    const result = engine.computeFractal(0, 0);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('generates fractal data with correct length', () => {
    const engine = new FractalEngine();
    const data = engine.generateFractalData(10, 10);
    expect(data.length).toBe(10 * 10 * 4); // RGBA
  });

  it('generates non-zero pixel data', () => {
    const engine = new FractalEngine();
    const data = engine.generateFractalData(10, 10);
    // Alpha channel should always be 255
    expect(data[3]).toBe(255);
  });
});
