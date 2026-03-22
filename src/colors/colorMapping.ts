/**
 * Pure color-mapping functions shared between the main thread (ColorScheme.ts)
 * and Web Workers (fractal.worker.ts).
 *
 * Every function here is free of DOM / class / side-effect dependencies so it
 * can safely run inside a worker context.
 */

import type { ColorParams } from './ColorParams.ts';

export interface RGB {
  r: number;
  g: number;
  b: number;
}

const BLACK: RGB = { r: 0, g: 0, b: 0 };

/* ------------------------------------------------------------------ */
/*  Internal helpers for ColorParams post-processing                  */
/* ------------------------------------------------------------------ */

/**
 * Convert an RGB colour to HSL (h 0-360, s 0-1, l 0-1).
 */
function rgbToHslRaw(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}

/**
 * Apply colour-parameter adjustments to a raw RGB value.
 *
 * The flow is: RGB -> HSL -> shift hue, scale saturation -> RGB -> scale brightness.
 */
function applyColorParams(rgb: RGB, params: ColorParams): RGB {
  // Convert to HSL so we can adjust hue and saturation
  let [h, s, l] = rgbToHslRaw(rgb.r, rgb.g, rgb.b);

  // Hue offset (shift in degrees)
  h = (h + params.hueOffset) % 360;
  if (h < 0) h += 360;

  // Saturation scale (0-200 → 0-2 multiplier)
  s = Math.min(1, s * (params.saturation / 100));

  // Brightness scale — adjust lightness
  l = Math.min(1, l * (params.brightness / 100));

  // Convert back to RGB via the existing hslToRgb (expects s/l in 0-100 range)
  return hslToRgb(h, s * 100, l * 100);
}

/**
 * Apply contrast and cycleSpeed to the iteration ratio `t`.
 *
 * - `cycleSpeed` multiplies the raw ratio, then wraps to [0,1).
 * - `contrast` applies a sigmoid-like curve centred on 0.5.
 */
function applyIterationParams(t: number, params: ColorParams): number {
  // Cycle speed — multiply and wrap
  t = (t * params.cycleSpeed) % 1;

  // Contrast — sigmoid curve around 0.5
  t = 0.5 + (t - 0.5) * (params.contrast / 100);
  t = Math.max(0, Math.min(1, t));

  return t;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

/**
 * Convert an HSL colour (h 0-360, s 0-100, l 0-100) to an RGB object
 * with each channel in the 0-255 range.
 */
export function hslToRgb(h: number, s: number, l: number): RGB {
  h = h % 360;
  s = s / 100;
  l = l / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));

  let r = 0,
    g = 0,
    b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const m = l - c / 2;
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

/** Classic HSL rainbow sweep. */
export function mapClassicHsl(iterations: number, maxIterations: number, colorParams?: ColorParams): RGB {
  if (iterations >= maxIterations) return BLACK;
  let t = iterations / maxIterations;
  if (colorParams) t = applyIterationParams(t, colorParams);
  const hue = t * 360;
  const rgb = hslToRgb(hue, 100, 50);
  return colorParams ? applyColorParams(rgb, colorParams) : rgb;
}

/** Fire gradient (red -> yellow -> white). */
export function mapFire(iterations: number, maxIterations: number, colorParams?: ColorParams): RGB {
  if (iterations >= maxIterations) return BLACK;
  let t = iterations / maxIterations;
  if (colorParams) t = applyIterationParams(t, colorParams);
  const rgb: RGB = {
    r: Math.round(Math.min(255, t * 3 * 255)),
    g: Math.round(Math.min(255, Math.max(0, (t * 3 - 1) * 255))),
    b: Math.round(Math.min(255, Math.max(0, (t * 3 - 2) * 255))),
  };
  return colorParams ? applyColorParams(rgb, colorParams) : rgb;
}

/** Ocean gradient (dark blue -> teal). */
export function mapOcean(iterations: number, maxIterations: number, colorParams?: ColorParams): RGB {
  if (iterations >= maxIterations) return BLACK;
  let t = iterations / maxIterations;
  if (colorParams) t = applyIterationParams(t, colorParams);
  const rgb: RGB = {
    r: Math.round(t * 50),
    g: Math.round(t * 150 + 50),
    b: Math.round(Math.min(255, t * 255 + 100)),
  };
  return colorParams ? applyColorParams(rgb, colorParams) : rgb;
}

/** Simple greyscale. */
export function mapGrayscale(iterations: number, maxIterations: number, colorParams?: ColorParams): RGB {
  if (iterations >= maxIterations) return BLACK;
  let t = iterations / maxIterations;
  if (colorParams) t = applyIterationParams(t, colorParams);
  const v = Math.round(t * 255);
  const rgb: RGB = { r: v, g: v, b: v };
  return colorParams ? applyColorParams(rgb, colorParams) : rgb;
}

/** Neon glow (cyan -> magenta). */
export function mapNeon(iterations: number, maxIterations: number, colorParams?: ColorParams): RGB {
  if (iterations >= maxIterations) return BLACK;
  let t = iterations / maxIterations;
  if (colorParams) t = applyIterationParams(t, colorParams);
  const hue = (t * 300 + 180) % 360;
  const rgb = hslToRgb(hue, 100, 60);
  return colorParams ? applyColorParams(rgb, colorParams) : rgb;
}

/**
 * Look up a colour scheme by its display name and return the mapped colour.
 * Falls back to Classic HSL for unknown names.
 */
export function mapColorByName(
  iterations: number,
  maxIterations: number,
  schemeName: string,
  colorParams?: ColorParams,
): RGB {
  switch (schemeName) {
    case 'Fire':
      return mapFire(iterations, maxIterations, colorParams);
    case 'Ocean':
      return mapOcean(iterations, maxIterations, colorParams);
    case 'Grayscale':
      return mapGrayscale(iterations, maxIterations, colorParams);
    case 'Neon':
      return mapNeon(iterations, maxIterations, colorParams);
    default:
      return mapClassicHsl(iterations, maxIterations, colorParams);
  }
}
