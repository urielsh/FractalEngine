import { describe, it, expect } from 'vitest';
import {
  isInsideShape,
  distortCoordinates,
  defaultShapeConfig,
  type ShapeConfig,
} from '../boundaries/ShapeBoundary';
import { buildLUT, lookupLUT } from '../boundaries/DistortionLUT';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ovalConfig(aspectRatio = 1): ShapeConfig {
  return { shape: 'oval', mode: 'mask', aspectRatio, roundness: 0 };
}

function triangleConfig(roundness = 0): ShapeConfig {
  return { shape: 'triangle', mode: 'mask', aspectRatio: 1, roundness };
}

function rectConfig(aspectRatio = 1, roundness = 0): ShapeConfig {
  return { shape: 'rectangle', mode: 'mask', aspectRatio, roundness };
}

// ---------------------------------------------------------------------------
// isInsideShape
// ---------------------------------------------------------------------------

describe('isInsideShape', () => {
  it('center (0,0) is inside oval', () => {
    expect(isInsideShape(0, 0, ovalConfig())).toBe(true);
  });

  it('center (0,0) is inside triangle', () => {
    expect(isInsideShape(0, 0, triangleConfig())).toBe(true);
  });

  it('center (0,0) is inside rectangle', () => {
    expect(isInsideShape(0, 0, rectConfig())).toBe(true);
  });

  it('far point (10,10) is outside oval', () => {
    expect(isInsideShape(10, 10, ovalConfig())).toBe(false);
  });

  it('far point (10,10) is outside triangle', () => {
    expect(isInsideShape(10, 10, triangleConfig())).toBe(false);
  });

  it('far point (10,10) is outside rectangle', () => {
    expect(isInsideShape(10, 10, rectConfig())).toBe(false);
  });

  it('oval: aspect ratio stretching — (1.5, 0) inside when aspectRatio=2', () => {
    expect(isInsideShape(1.5, 0, ovalConfig(2))).toBe(true);
  });

  it('oval: aspect ratio stretching — (1.5, 0) outside when aspectRatio=1', () => {
    expect(isInsideShape(1.5, 0, ovalConfig(1))).toBe(false);
  });

  it('rectangle: point inside', () => {
    expect(isInsideShape(0.5, 0.5, rectConfig(1))).toBe(true);
  });

  it('rectangle: point outside', () => {
    expect(isInsideShape(2, 0, rectConfig(1))).toBe(false);
  });

  it('rectangle: corner rounding shrinks corner area', () => {
    // Without rounding, a corner point just inside the box is inside
    const corner = { x: 0.99, y: 0.99 };
    expect(isInsideShape(corner.x, corner.y, rectConfig(1, 0))).toBe(true);
    // With maximum rounding, same corner point should be outside
    expect(isInsideShape(corner.x, corner.y, rectConfig(1, 1))).toBe(false);
  });

  it('"none" shape always returns true', () => {
    const config = defaultShapeConfig(); // shape: 'none'
    expect(isInsideShape(0, 0, config)).toBe(true);
    expect(isInsideShape(999, 999, config)).toBe(true);
    expect(isInsideShape(-50, 100, config)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// distortCoordinates
// ---------------------------------------------------------------------------

describe('distortCoordinates', () => {
  it('center (0,0) stays near center for oval', () => {
    const result = distortCoordinates(0, 0, ovalConfig());
    expect(Math.abs(result.x)).toBeLessThan(0.01);
    expect(Math.abs(result.y)).toBeLessThan(0.01);
  });

  it('center (0,0) stays near center for triangle', () => {
    const result = distortCoordinates(0, 0, triangleConfig());
    expect(Math.abs(result.x)).toBeLessThan(0.01);
    expect(Math.abs(result.y)).toBeLessThan(0.01);
  });

  it('center (0,0) stays near center for rectangle', () => {
    const result = distortCoordinates(0, 0, rectConfig());
    expect(Math.abs(result.x)).toBeLessThan(0.01);
    expect(Math.abs(result.y)).toBeLessThan(0.01);
  });

  it('"none" shape returns identity', () => {
    const config = defaultShapeConfig();
    const result = distortCoordinates(0.7, -0.3, config);
    expect(result.x).toBe(0.7);
    expect(result.y).toBe(-0.3);
  });
});

// ---------------------------------------------------------------------------
// buildLUT / lookupLUT
// ---------------------------------------------------------------------------

describe('buildLUT', () => {
  it('returns a Float32Array of length 720', () => {
    const lut = buildLUT(ovalConfig());
    expect(lut).toBeInstanceOf(Float32Array);
    expect(lut.length).toBe(720);
  });

  it('all entries > 0 for oval', () => {
    const lut = buildLUT(ovalConfig());
    for (let i = 0; i < lut.length; i++) {
      expect(lut[i]).toBeGreaterThan(0);
    }
  });
});

describe('lookupLUT', () => {
  it('returns reasonable values for oval at 0 and 90 degrees', () => {
    const lut = buildLUT(ovalConfig(2));
    const r0 = lookupLUT(lut, 0);
    const r90 = lookupLUT(lut, 90);
    // At 0 degrees the oval extends by aspectRatio (2), at 90 degrees by 1
    expect(r0).toBeCloseTo(2, 1);
    expect(r90).toBeCloseTo(1, 1);
  });
});

// ---------------------------------------------------------------------------
// defaultShapeConfig
// ---------------------------------------------------------------------------

describe('defaultShapeConfig', () => {
  it('returns correct defaults', () => {
    const cfg = defaultShapeConfig();
    expect(cfg.shape).toBe('none');
    expect(cfg.mode).toBe('mask');
    expect(cfg.aspectRatio).toBe(1.0);
    expect(cfg.roundness).toBe(0);
  });
});
