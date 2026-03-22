import { describe, it, expect } from 'vitest';
import {
  hslToRgb,
  mapClassicHsl,
  mapFire,
  mapOcean,
  mapGrayscale,
  mapNeon,
  mapColorByName,
} from '../colors/colorMapping.ts';

function isValidRgb(c: { r: number; g: number; b: number }): boolean {
  return (
    Number.isInteger(c.r) && c.r >= 0 && c.r <= 255 &&
    Number.isInteger(c.g) && c.g >= 0 && c.g <= 255 &&
    Number.isInteger(c.b) && c.b >= 0 && c.b <= 255
  );
}

const BLACK = { r: 0, g: 0, b: 0 };

describe('hslToRgb', () => {
  it('returns red for h=0 s=100 l=50', () => {
    const c = hslToRgb(0, 100, 50);
    expect(c).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('returns a mid-grey for l=50 s=0 (h irrelevant)', () => {
    const c = hslToRgb(0, 0, 50);
    expect(c).toEqual({ r: 128, g: 128, b: 128 });
  });

  it('returns black for l=0', () => {
    const c = hslToRgb(0, 100, 0);
    expect(c).toEqual(BLACK);
  });

  it('returns white for l=100', () => {
    const c = hslToRgb(0, 100, 100);
    expect(c).toEqual({ r: 255, g: 255, b: 255 });
  });
});

describe('mapClassicHsl', () => {
  it('returns valid RGB for non-converged points', () => {
    const c = mapClassicHsl(50, 256);
    expect(isValidRgb(c)).toBe(true);
  });

  it('returns black for converged points', () => {
    expect(mapClassicHsl(256, 256)).toEqual(BLACK);
    expect(mapClassicHsl(300, 256)).toEqual(BLACK);
  });
});

describe('mapFire', () => {
  it('returns valid RGB in range', () => {
    const c = mapFire(100, 256);
    expect(isValidRgb(c)).toBe(true);
  });

  it('returns black for converged points', () => {
    expect(mapFire(256, 256)).toEqual(BLACK);
  });
});

describe('mapOcean', () => {
  it('returns valid RGB in range', () => {
    const c = mapOcean(80, 256);
    expect(isValidRgb(c)).toBe(true);
  });

  it('returns black for converged points', () => {
    expect(mapOcean(256, 256)).toEqual(BLACK);
  });
});

describe('mapGrayscale', () => {
  it('returns equal r, g, b channels', () => {
    const c = mapGrayscale(128, 256);
    expect(c.r).toBe(c.g);
    expect(c.g).toBe(c.b);
  });

  it('returns black for converged points', () => {
    expect(mapGrayscale(256, 256)).toEqual(BLACK);
  });
});

describe('mapNeon', () => {
  it('returns valid RGB in range', () => {
    const c = mapNeon(200, 256);
    expect(isValidRgb(c)).toBe(true);
  });

  it('returns black for converged points', () => {
    expect(mapNeon(256, 256)).toEqual(BLACK);
  });
});

describe('mapColorByName', () => {
  it('delegates to Fire scheme correctly', () => {
    const direct = mapFire(50, 256);
    const byName = mapColorByName(50, 256, 'Fire');
    expect(byName).toEqual(direct);
  });

  it('delegates to Ocean scheme correctly', () => {
    const direct = mapOcean(50, 256);
    const byName = mapColorByName(50, 256, 'Ocean');
    expect(byName).toEqual(direct);
  });

  it('delegates to Grayscale scheme correctly', () => {
    const direct = mapGrayscale(50, 256);
    const byName = mapColorByName(50, 256, 'Grayscale');
    expect(byName).toEqual(direct);
  });

  it('delegates to Neon scheme correctly', () => {
    const direct = mapNeon(50, 256);
    const byName = mapColorByName(50, 256, 'Neon');
    expect(byName).toEqual(direct);
  });

  it('falls back to Classic HSL for unknown names', () => {
    const direct = mapClassicHsl(50, 256);
    const byName = mapColorByName(50, 256, 'UnknownScheme');
    expect(byName).toEqual(direct);
  });
});
