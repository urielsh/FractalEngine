import { describe, it, expect } from 'vitest';
import {
  interpolateGradient,
  mapWithGradient,
  type GradientStop,
} from '../colors/GradientEditor';

/* ------------------------------------------------------------------ */
/*  interpolateGradient                                                */
/* ------------------------------------------------------------------ */

describe('interpolateGradient', () => {
  const twoStops: GradientStop[] = [
    { position: 0, color: { r: 0, g: 0, b: 0 } },
    { position: 1, color: { r: 255, g: 255, b: 255 } },
  ];

  it('returns first stop colour at t=0', () => {
    expect(interpolateGradient(0, twoStops)).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('returns last stop colour at t=1', () => {
    expect(interpolateGradient(1, twoStops)).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('returns midpoint colour at t=0.5', () => {
    const mid = interpolateGradient(0.5, twoStops);
    expect(mid).toEqual({ r: 128, g: 128, b: 128 });
  });

  it('interpolates the correct segment in a 4-stop gradient', () => {
    const fourStops: GradientStop[] = [
      { position: 0.0, color: { r: 0, g: 0, b: 0 } },
      { position: 0.25, color: { r: 100, g: 0, b: 0 } },
      { position: 0.75, color: { r: 100, g: 200, b: 0 } },
      { position: 1.0, color: { r: 255, g: 255, b: 255 } },
    ];

    // t=0.5 sits exactly in the middle of the second segment (0.25 -> 0.75)
    // local = (0.5 - 0.25) / (0.75 - 0.25) = 0.5
    // r = 100 + (100 - 100) * 0.5 = 100
    // g = 0 + (200 - 0) * 0.5 = 100
    // b = 0
    const c = interpolateGradient(0.5, fourStops);
    expect(c).toEqual({ r: 100, g: 100, b: 0 });
  });

  it('returns the single stop colour for any t when there is one stop', () => {
    const single: GradientStop[] = [
      { position: 0.5, color: { r: 42, g: 84, b: 126 } },
    ];
    expect(interpolateGradient(0, single)).toEqual({ r: 42, g: 84, b: 126 });
    expect(interpolateGradient(0.5, single)).toEqual({ r: 42, g: 84, b: 126 });
    expect(interpolateGradient(1, single)).toEqual({ r: 42, g: 84, b: 126 });
  });

  it('returns black for empty stops', () => {
    expect(interpolateGradient(0, [])).toEqual({ r: 0, g: 0, b: 0 });
    expect(interpolateGradient(0.5, [])).toEqual({ r: 0, g: 0, b: 0 });
    expect(interpolateGradient(1, [])).toEqual({ r: 0, g: 0, b: 0 });
  });
});

/* ------------------------------------------------------------------ */
/*  mapWithGradient                                                    */
/* ------------------------------------------------------------------ */

describe('mapWithGradient', () => {
  const stops: GradientStop[] = [
    { position: 0, color: { r: 0, g: 0, b: 0 } },
    { position: 1, color: { r: 255, g: 255, b: 255 } },
  ];

  it('returns [0,0,0] for converged points (iterations >= maxIterations)', () => {
    expect(mapWithGradient(256, 256, stops)).toEqual([0, 0, 0]);
    expect(mapWithGradient(300, 256, stops)).toEqual([0, 0, 0]);
  });

  it('doubles the cycle rate when cycleSpeed=2.0', () => {
    // Without cycle speed: t = 64/256 = 0.25
    const normal = mapWithGradient(64, 256, stops, 1.0);
    // With cycleSpeed=2: t = (64/256)*2 = 0.5 mod 1.0 = 0.5
    const doubled = mapWithGradient(64, 256, stops, 2.0);

    // normal should give ~25% brightness, doubled should give ~50% brightness
    // For a black-to-white gradient: normal ≈ [64,64,64], doubled ≈ [128,128,128]
    expect(normal).toEqual([64, 64, 64]);
    expect(doubled).toEqual([128, 128, 128]);
  });
});
