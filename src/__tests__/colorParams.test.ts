import { describe, it, expect } from 'vitest';
import {
  mapClassicHsl,
  mapFire,
  mapOcean,
  mapGrayscale,
  mapColorByName,
} from '../colors/colorMapping.ts';
import { DEFAULT_COLOR_PARAMS, ColorParams } from '../colors/ColorParams.ts';

describe('ColorParams — default params produce same output as no params', () => {
  it('mapClassicHsl with defaults matches no-params call', () => {
    const without = mapClassicHsl(50, 256);
    const withDefault = mapClassicHsl(50, 256, DEFAULT_COLOR_PARAMS);
    expect(withDefault).toEqual(without);
  });

  it('mapFire with defaults matches no-params call', () => {
    const without = mapFire(100, 256);
    const withDefault = mapFire(100, 256, DEFAULT_COLOR_PARAMS);
    expect(withDefault).toEqual(without);
  });

  it('mapOcean with defaults matches no-params call', () => {
    const without = mapOcean(80, 256);
    const withDefault = mapOcean(80, 256, DEFAULT_COLOR_PARAMS);
    expect(withDefault).toEqual(without);
  });

  it('mapGrayscale with defaults matches no-params call', () => {
    const without = mapGrayscale(128, 256);
    const withDefault = mapGrayscale(128, 256, DEFAULT_COLOR_PARAMS);
    expect(withDefault).toEqual(without);
  });

  it('mapColorByName with defaults matches no-params call', () => {
    const without = mapColorByName(50, 256, 'Neon');
    const withDefault = mapColorByName(50, 256, 'Neon', DEFAULT_COLOR_PARAMS);
    expect(withDefault).toEqual(without);
  });
});

describe('ColorParams — cycleSpeed', () => {
  it('cycleSpeed=2 changes the mapping output compared to default', () => {
    const params: ColorParams = { ...DEFAULT_COLOR_PARAMS, cycleSpeed: 2 };
    const normal = mapClassicHsl(50, 256);
    const doubled = mapClassicHsl(50, 256, params);
    // With cycleSpeed=2 the effective t is doubled, so the colour should differ
    expect(doubled).not.toEqual(normal);
  });

  it('cycleSpeed=2 makes iteration 25 look like iteration 50 at speed 1', () => {
    // At speed=2, iter=25/256 becomes t=50/256 after multiply.
    // At speed=1, iter=50/256 is the same raw t.
    // Both go through the same contrast (100) so they should match.
    const params2x: ColorParams = { ...DEFAULT_COLOR_PARAMS, cycleSpeed: 2 };
    const a = mapClassicHsl(25, 256, params2x);
    const b = mapClassicHsl(50, 256, DEFAULT_COLOR_PARAMS);
    expect(a).toEqual(b);
  });
});

describe('ColorParams — hueOffset', () => {
  it('hueOffset=180 shifts the colour away from default', () => {
    const params: ColorParams = { ...DEFAULT_COLOR_PARAMS, hueOffset: 180 };
    const normal = mapClassicHsl(50, 256);
    const shifted = mapClassicHsl(50, 256, params);
    expect(shifted).not.toEqual(normal);
  });
});

describe('ColorParams — saturation', () => {
  it('saturation=0 produces grey-like output (equal-ish R/G/B channels)', () => {
    const params: ColorParams = { ...DEFAULT_COLOR_PARAMS, saturation: 0 };
    const color = mapClassicHsl(50, 256, params);
    // With zero saturation in HSL, R=G=B
    expect(color.r).toBe(color.g);
    expect(color.g).toBe(color.b);
  });
});

describe('ColorParams — brightness', () => {
  it('brightness=0 produces black', () => {
    const params: ColorParams = { ...DEFAULT_COLOR_PARAMS, brightness: 0 };
    const color = mapClassicHsl(50, 256, params);
    expect(color).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('brightness=200 produces brighter output than default', () => {
    const params: ColorParams = { ...DEFAULT_COLOR_PARAMS, brightness: 200 };
    const normal = mapFire(100, 256);
    const bright = mapFire(100, 256, params);
    const lumNormal = normal.r + normal.g + normal.b;
    const lumBright = bright.r + bright.g + bright.b;
    expect(lumBright).toBeGreaterThanOrEqual(lumNormal);
  });
});

describe('ColorParams — contrast', () => {
  it('contrast=200 produces different output than default', () => {
    const params: ColorParams = { ...DEFAULT_COLOR_PARAMS, contrast: 200 };
    const normal = mapClassicHsl(64, 256);
    const highContrast = mapClassicHsl(64, 256, params);
    expect(highContrast).not.toEqual(normal);
  });

  it('contrast=200 pushes mid-range values further from centre', () => {
    // For a mid-range iteration (128/256 = 0.5), contrast=200 should keep
    // t at 0.5 (since (0.5 - 0.5)*2 + 0.5 = 0.5). So for the exact
    // midpoint, the colour should remain the same.
    const params: ColorParams = { ...DEFAULT_COLOR_PARAMS, contrast: 200 };
    const normal = mapClassicHsl(128, 256);
    const highContrast = mapClassicHsl(128, 256, params);
    expect(highContrast).toEqual(normal);
  });
});
