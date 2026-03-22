/**
 * Color parameter system for fine-grained colour adjustment.
 *
 * These parameters are applied *after* the base colour scheme produces an
 * initial RGB value, giving the user creative control over hue, saturation,
 * brightness, contrast and animation speed without changing the underlying
 * mapping algorithm.
 */

export interface ColorParams {
  /** Hue rotation in degrees (0-360). */
  hueOffset: number;
  /** Saturation scale as a percentage (0-200, 100 = default). */
  saturation: number;
  /** Brightness scale as a percentage (0-200, 100 = default). */
  brightness: number;
  /** Contrast intensity as a percentage (0-200, 100 = default). */
  contrast: number;
  /** Multiplier for the iteration-ratio cycle (0.1-5.0, 1.0 = default). */
  cycleSpeed: number;
}

export const DEFAULT_COLOR_PARAMS: ColorParams = {
  hueOffset: 0,
  saturation: 100,
  brightness: 100,
  contrast: 100,
  cycleSpeed: 1.0,
};
