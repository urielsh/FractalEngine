// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BREAKPOINT_MOBILE } from '../constants';

// We test the pure exported functions from FractalRenderer.
// Because they read `window.devicePixelRatio` and `window.innerWidth`,
// we stub those globals per-test.

describe('getOptimalResolution', () => {
  let origDpr: number;

  beforeEach(() => {
    origDpr = window.devicePixelRatio;
  });

  afterEach(() => {
    Object.defineProperty(window, 'devicePixelRatio', {
      value: origDpr,
      configurable: true,
      writable: true,
    });
  });

  async function loadFn() {
    // Dynamic import so stubbed globals are read at call time
    const mod = await import('../renderer/FractalRenderer');
    return mod.getOptimalResolution;
  }

  it('scales by devicePixelRatio = 1', async () => {
    Object.defineProperty(window, 'devicePixelRatio', { value: 1, configurable: true });
    const getOptimalResolution = await loadFn();
    const result = getOptimalResolution(800, 600);
    expect(result).toEqual({ width: 800, height: 600 });
  });

  it('scales by devicePixelRatio = 2', async () => {
    Object.defineProperty(window, 'devicePixelRatio', { value: 2, configurable: true });
    const getOptimalResolution = await loadFn();
    const result = getOptimalResolution(800, 600);
    expect(result).toEqual({ width: 1600, height: 1200 });
  });

  it('caps devicePixelRatio at 2 for ultra-high-DPI screens', async () => {
    Object.defineProperty(window, 'devicePixelRatio', { value: 3, configurable: true });
    const getOptimalResolution = await loadFn();
    const result = getOptimalResolution(800, 600);
    // Capped at 2x: 800*2=1600, 600*2=1200
    expect(result).toEqual({ width: 1600, height: 1200 });
  });

  it('defaults to dpr=1 when devicePixelRatio is undefined', async () => {
    Object.defineProperty(window, 'devicePixelRatio', { value: undefined, configurable: true });
    const getOptimalResolution = await loadFn();
    const result = getOptimalResolution(1024, 768);
    expect(result).toEqual({ width: 1024, height: 768 });
  });

  it('rounds fractional results', async () => {
    Object.defineProperty(window, 'devicePixelRatio', { value: 1.5, configurable: true });
    const getOptimalResolution = await loadFn();
    const result = getOptimalResolution(333, 221);
    expect(result.width).toBe(Math.round(333 * 1.5));
    expect(result.height).toBe(Math.round(221 * 1.5));
  });

  it('handles zero dimensions', async () => {
    Object.defineProperty(window, 'devicePixelRatio', { value: 2, configurable: true });
    const getOptimalResolution = await loadFn();
    const result = getOptimalResolution(0, 0);
    expect(result).toEqual({ width: 0, height: 0 });
  });
});

describe('getMobileMaxIterations', () => {
  let origInnerWidth: number;

  beforeEach(() => {
    origInnerWidth = window.innerWidth;
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      value: origInnerWidth,
      configurable: true,
      writable: true,
    });
  });

  async function loadFn() {
    const mod = await import('../renderer/FractalRenderer');
    return mod.getMobileMaxIterations;
  }

  it('returns 50% of default on mobile viewports (width < BREAKPOINT_MOBILE)', async () => {
    Object.defineProperty(window, 'innerWidth', { value: BREAKPOINT_MOBILE - 1, configurable: true });
    const getMobileMaxIterations = await loadFn();
    expect(getMobileMaxIterations(256)).toBe(128);
  });

  it('returns full iterations on desktop viewports (width >= BREAKPOINT_MOBILE)', async () => {
    Object.defineProperty(window, 'innerWidth', { value: BREAKPOINT_MOBILE, configurable: true });
    const getMobileMaxIterations = await loadFn();
    expect(getMobileMaxIterations(256)).toBe(256);
  });

  it('returns full iterations for large viewports', async () => {
    Object.defineProperty(window, 'innerWidth', { value: 1920, configurable: true });
    const getMobileMaxIterations = await loadFn();
    expect(getMobileMaxIterations(500)).toBe(500);
  });

  it('rounds the result for odd default values', async () => {
    Object.defineProperty(window, 'innerWidth', { value: 320, configurable: true });
    const getMobileMaxIterations = await loadFn();
    // 255 * 0.5 = 127.5 -> Math.round -> 128
    expect(getMobileMaxIterations(255)).toBe(128);
  });

  it('handles zero iterations', async () => {
    Object.defineProperty(window, 'innerWidth', { value: 320, configurable: true });
    const getMobileMaxIterations = await loadFn();
    expect(getMobileMaxIterations(0)).toBe(0);
  });

  it('treats the breakpoint boundary (exactly 600) as desktop', async () => {
    Object.defineProperty(window, 'innerWidth', { value: 600, configurable: true });
    const getMobileMaxIterations = await loadFn();
    expect(getMobileMaxIterations(200)).toBe(200);
  });
});
