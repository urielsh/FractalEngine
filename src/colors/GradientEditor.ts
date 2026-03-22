/**
 * Pure gradient editor functions for custom colour mapping.
 *
 * All functions are free of DOM / side-effect dependencies so they can
 * safely run inside a Web Worker context.
 */

export interface GradientStop {
  position: number; // 0-1
  color: { r: number; g: number; b: number };
}

/**
 * Interpolate a colour from a sorted gradient at parameter `t` (0-1).
 *
 * - `t` is clamped to [0, 1].
 * - Stops are sorted by position before interpolation.
 * - If there are no stops, returns black.
 * - If there is a single stop, returns that colour for all `t`.
 * - For `t` between two stops, performs linear RGB interpolation.
 */
export function interpolateGradient(
  t: number,
  stops: GradientStop[],
): { r: number; g: number; b: number } {
  if (stops.length === 0) return { r: 0, g: 0, b: 0 };

  // Clamp t to [0, 1]
  t = Math.max(0, Math.min(1, t));

  // Sort by position (non-mutating)
  const sorted = [...stops].sort((a, b) => a.position - b.position);

  if (sorted.length === 1) {
    const c = sorted[0].color;
    return { r: c.r, g: c.g, b: c.b };
  }

  // Before or at the first stop
  if (t <= sorted[0].position) {
    const c = sorted[0].color;
    return { r: c.r, g: c.g, b: c.b };
  }

  // At or after the last stop
  if (t >= sorted[sorted.length - 1].position) {
    const c = sorted[sorted.length - 1].color;
    return { r: c.r, g: c.g, b: c.b };
  }

  // Find the two surrounding stops and lerp
  for (let i = 0; i < sorted.length - 1; i++) {
    const s0 = sorted[i];
    const s1 = sorted[i + 1];
    if (t >= s0.position && t <= s1.position) {
      const range = s1.position - s0.position;
      const local = range === 0 ? 0 : (t - s0.position) / range;
      return {
        r: Math.round(s0.color.r + (s1.color.r - s0.color.r) * local),
        g: Math.round(s0.color.g + (s1.color.g - s0.color.g) * local),
        b: Math.round(s0.color.b + (s1.color.b - s0.color.b) * local),
      };
    }
  }

  // Fallback (should not be reached)
  const c = sorted[sorted.length - 1].color;
  return { r: c.r, g: c.g, b: c.b };
}

/**
 * Map a fractal iteration count to an RGB colour via the custom gradient.
 *
 * - Converged points (iterations >= maxIterations) always return [0, 0, 0].
 * - Otherwise `t = (iterations / maxIterations) * cycleSpeed`, wrapped to [0, 1)
 *   via modulo, then looked up in the gradient.
 */
export function mapWithGradient(
  iterations: number,
  maxIterations: number,
  stops: GradientStop[],
  cycleSpeed?: number,
): [number, number, number] {
  if (iterations >= maxIterations) return [0, 0, 0];

  let t = (iterations / maxIterations) * (cycleSpeed || 1.0);
  t = t % 1.0;
  // Ensure positive after modulo (handles negative edge cases)
  if (t < 0) t += 1.0;

  const rgb = interpolateGradient(t, stops);
  return [rgb.r, rgb.g, rgb.b];
}
