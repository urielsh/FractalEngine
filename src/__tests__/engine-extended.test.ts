import { describe, it, expect } from 'vitest';
import { FractalEngine } from '../engine/FractalEngine';

describe('Color scheme management', () => {
  it('defaults to Classic HSL', () => {
    const engine = new FractalEngine();
    expect(engine.getColorScheme().name).toBe('Classic HSL');
  });

  it('setColorScheme switches to Fire', () => {
    const engine = new FractalEngine();
    engine.setColorScheme('Fire');
    expect(engine.getColorScheme().name).toBe('Fire');
  });

  it('setColorScheme ignores invalid name', () => {
    const engine = new FractalEngine();
    engine.setColorScheme('Nonexistent');
    expect(engine.getColorScheme().name).toBe('Classic HSL');
  });

  it('getAvailableColorSchemes returns 5 names', () => {
    const engine = new FractalEngine();
    const schemes = engine.getAvailableColorSchemes();
    expect(schemes).toHaveLength(5);
    expect(schemes).toContain('Classic HSL');
    expect(schemes).toContain('Fire');
    expect(schemes).toContain('Ocean');
    expect(schemes).toContain('Grayscale');
    expect(schemes).toContain('Neon');
  });
});

describe('getCurrentFractalType', () => {
  it('returns mandelbrot by default', () => {
    const engine = new FractalEngine();
    expect(engine.getCurrentFractalType()).toBe('mandelbrot');
  });

  it('returns julia after switching', () => {
    const engine = new FractalEngine();
    engine.setFractalType('julia');
    expect(engine.getCurrentFractalType()).toBe('julia');
  });

  it('returns lsystem after switching', () => {
    const engine = new FractalEngine();
    engine.setFractalType('lsystem');
    expect(engine.getCurrentFractalType()).toBe('lsystem');
  });
});

describe('getComputeParams serialization', () => {
  it('mandelbrot has fractalType, maxIterations, escapeRadius', () => {
    const engine = new FractalEngine();
    const params = engine.getComputeParams();
    expect(params.fractalType).toBe('mandelbrot');
    expect(params.maxIterations).toBe(256);
    expect(params.escapeRadius).toBe(2.0);
    expect(params.cReal).toBeUndefined();
    expect(params.cImag).toBeUndefined();
  });

  it('julia includes cReal and cImag', () => {
    const engine = new FractalEngine();
    engine.setFractalType('julia');
    const params = engine.getComputeParams();
    expect(params.fractalType).toBe('julia');
    expect(params.cReal).toBeDefined();
    expect(params.cImag).toBeDefined();
    expect(typeof params.cReal).toBe('number');
    expect(typeof params.cImag).toBe('number');
  });
});

describe('Gradient support', () => {
  it('gradient is disabled by default', () => {
    const engine = new FractalEngine();
    expect(engine.isGradientEnabled()).toBe(false);
  });

  it('setGradient enables gradient with stops', () => {
    const engine = new FractalEngine();
    const stops = [
      { position: 0, color: { r: 255, g: 0, b: 0 } },
      { position: 1, color: { r: 0, g: 0, b: 255 } },
    ];
    engine.setGradient(stops, true);
    expect(engine.isGradientEnabled()).toBe(true);
    expect(engine.getGradientStops()).toHaveLength(2);
  });

  it('setGradient can disable gradient', () => {
    const engine = new FractalEngine();
    const stops = [
      { position: 0, color: { r: 255, g: 0, b: 0 } },
      { position: 1, color: { r: 0, g: 0, b: 255 } },
    ];
    engine.setGradient(stops, true);
    engine.setGradient([], false);
    expect(engine.isGradientEnabled()).toBe(false);
  });
});

describe('Shape config', () => {
  it('defaults to shape none', () => {
    const engine = new FractalEngine();
    expect(engine.getShapeConfig().shape).toBe('none');
  });

  it('setShapeConfig updates shape', () => {
    const engine = new FractalEngine();
    engine.setShapeConfig({ shape: 'oval', mode: 'mask', aspectRatio: 1.0, roundness: 0 });
    expect(engine.getShapeConfig().shape).toBe('oval');
  });

  it('setShapeConfig rebuilds LUT for non-none shapes', () => {
    const engine = new FractalEngine();
    engine.setShapeConfig({ shape: 'oval', mode: 'distortion', aspectRatio: 1.5, roundness: 0 });
    expect(engine.getDistortionLUT().length).toBeGreaterThan(0);
  });

  it('setShapeConfig clears LUT for none shape', () => {
    const engine = new FractalEngine();
    engine.setShapeConfig({ shape: 'oval', mode: 'distortion', aspectRatio: 1.0, roundness: 0 });
    engine.setShapeConfig({ shape: 'none', mode: 'mask', aspectRatio: 1.0, roundness: 0 });
    expect(engine.getDistortionLUT()).toHaveLength(0);
  });
});

describe('ColorParams', () => {
  it('returns default color params', () => {
    const engine = new FractalEngine();
    const params = engine.getColorParams();
    expect(params.hueOffset).toBe(0);
    expect(params.saturation).toBe(100);
    expect(params.brightness).toBe(100);
    expect(params.contrast).toBe(100);
    expect(params.cycleSpeed).toBe(1.0);
  });

  it('setColorParams merges partial updates', () => {
    const engine = new FractalEngine();
    engine.setColorParams({ hueOffset: 180 });
    const params = engine.getColorParams();
    expect(params.hueOffset).toBe(180);
    expect(params.saturation).toBe(100); // unchanged
  });
});

describe('Edge cases', () => {
  it('generateFractalData for 1x1 pixel produces 4 bytes', () => {
    const engine = new FractalEngine();
    const data = engine.generateFractalData(1, 1);
    expect(data.length).toBe(4);
    expect(data[3]).toBe(255); // alpha
  });

  it('generateFractalData for 0x0 produces 0 bytes', () => {
    const engine = new FractalEngine();
    const data = engine.generateFractalData(0, 0);
    expect(data.length).toBe(0);
  });

  it('computeFractal returns non-negative', () => {
    const engine = new FractalEngine();
    const result = engine.computeFractal(0, 0);
    expect(result).toBeGreaterThanOrEqual(0);
  });
});
