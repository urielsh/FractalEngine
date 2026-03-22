/**
 * Shape Boundary definitions and hit-testing for fractal region clipping.
 * All functions are pure and worker-safe (no DOM references).
 */

import { isInsideChessPiece, type ChessPieceType } from './ChessPieces.ts';

export type ShapeType =
  | 'none'
  | 'oval'
  | 'triangle'
  | 'rectangle'
  | 'pawn'
  | 'rook'
  | 'bishop'
  | 'knight'
  | 'queen'
  | 'king';

/** The subset of ShapeType values that correspond to chess pieces. */
export const CHESS_PIECE_TYPES: ReadonlySet<string> = new Set<ChessPieceType>([
  'pawn',
  'rook',
  'bishop',
  'knight',
  'queen',
  'king',
]);
export type BoundaryMode = 'mask' | 'distortion';

export interface ShapeConfig {
  shape: ShapeType;
  mode: BoundaryMode;
  aspectRatio: number;
  roundness: number;
}

/** Returns a sensible default configuration (no boundary). */
export function defaultShapeConfig(): ShapeConfig {
  return {
    shape: 'none',
    mode: 'mask',
    aspectRatio: 1.0,
    roundness: 0,
  };
}

// ---------------------------------------------------------------------------
// Triangle helpers (equilateral, centred at origin)
// ---------------------------------------------------------------------------

/** Vertices of a unit equilateral triangle centred at origin (top vertex up). */
export function triangleVertices(roundness: number): [number, number][] {
  // Raw vertices: top, bottom-left, bottom-right
  const raw: [number, number][] = [
    [0, 1],
    [-Math.sqrt(3) / 2, -0.5],
    [Math.sqrt(3) / 2, -0.5],
  ];

  // Centroid is (0, 0) for a symmetric equilateral triangle centred at origin.
  // Lerp each vertex toward centroid by `roundness` (0 = sharp, 1 = collapsed to point).
  const cx = 0;
  const cy = 0;
  return raw.map(([vx, vy]) => [
    vx + (cx - vx) * roundness,
    vy + (cy - vy) * roundness,
  ]) as [number, number][];
}

/** Barycentric coordinate inside-triangle test. */
function pointInTriangle(
  px: number,
  py: number,
  v0: [number, number],
  v1: [number, number],
  v2: [number, number],
): boolean {
  const d00 = v0[0] - v2[0];
  const d01 = v1[0] - v2[0];
  const d10 = v0[1] - v2[1];
  const d11 = v1[1] - v2[1];
  const dpx = px - v2[0];
  const dpy = py - v2[1];

  const denom = d00 * d11 - d01 * d10;
  if (denom === 0) return false;

  const invDenom = 1 / denom;
  const u = (d11 * dpx - d01 * dpy) * invDenom;
  const v = (d00 * dpy - d10 * dpx) * invDenom;

  return u >= 0 && v >= 0 && u + v <= 1;
}

// ---------------------------------------------------------------------------
// isInsideShape
// ---------------------------------------------------------------------------

/**
 * Returns true when the normalised coordinate (nx, ny) lies inside the
 * configured shape boundary.
 *
 * Coordinates are assumed to be in a normalised space where the shape is
 * roughly inscribed in the unit circle.
 */
export function isInsideShape(
  nx: number,
  ny: number,
  config: ShapeConfig,
): boolean {
  // Chess piece delegation
  if (CHESS_PIECE_TYPES.has(config.shape)) {
    return isInsideChessPiece(nx, ny, config.shape as ChessPieceType);
  }

  switch (config.shape) {
    case 'none':
      return true;

    case 'oval':
      return (nx / config.aspectRatio) ** 2 + ny ** 2 <= 1;

    case 'triangle': {
      const verts = triangleVertices(config.roundness);
      return pointInTriangle(nx, ny, verts[0], verts[1], verts[2]);
    }

    case 'rectangle': {
      const halfW = config.aspectRatio;
      const halfH = 1;
      if (config.roundness <= 0) {
        return Math.abs(nx) <= halfW && Math.abs(ny) <= halfH;
      }
      // SDF rounded box: sdRoundedBox = length(max(q,0)) + min(max(q.x,q.y),0) - r
      const r = config.roundness * Math.min(halfW, halfH);
      const qx = Math.abs(nx) - halfW + r;
      const qy = Math.abs(ny) - halfH + r;
      const outside = Math.sqrt(Math.max(qx, 0) ** 2 + Math.max(qy, 0) ** 2);
      const inside = Math.min(Math.max(qx, qy), 0);
      return outside + inside - r <= 0;
    }

    default:
      return true;
  }
}

// ---------------------------------------------------------------------------
// distortCoordinates
// ---------------------------------------------------------------------------

/**
 * Distort (nx, ny) so that the shape boundary maps smoothly onto the fractal
 * region.  When a LUT is provided it is used for the boundary radius lookup;
 * otherwise the radius is computed analytically.
 *
 * For 'none' shape the coordinates are returned unchanged.
 */
export function distortCoordinates(
  nx: number,
  ny: number,
  config: ShapeConfig,
  lut?: Float32Array,
): { x: number; y: number } {
  if (config.shape === 'none') {
    return { x: nx, y: ny };
  }

  const angle = Math.atan2(ny, nx); // radians
  const radius = Math.sqrt(nx * nx + ny * ny);

  // Boundary radius at this angle
  let boundaryR: number;
  if (lut) {
    // Convert angle to degrees [0, 360)
    let deg = (angle * 180) / Math.PI;
    if (deg < 0) deg += 360;
    // Interpolate
    const idx = deg * 2; // 720 entries => 0.5 degree steps
    const i0 = Math.floor(idx) % 720;
    const i1 = (i0 + 1) % 720;
    const frac = idx - Math.floor(idx);
    boundaryR = lut[i0] * (1 - frac) + lut[i1] * frac;
  } else {
    boundaryR = computeBoundaryRadius(angle, config);
  }

  // Scale radius so that boundaryR maps to 1 (the unit circle in fractal space)
  const scaledR = boundaryR > 0 ? radius / boundaryR : radius;

  const outX = scaledR * Math.cos(angle);
  const outY = scaledR * Math.sin(angle);

  return { x: outX, y: outY };
}

// ---------------------------------------------------------------------------
// Analytical boundary radius (used when no LUT is provided)
// ---------------------------------------------------------------------------

/**
 * Sample-based boundary radius for arbitrary shapes (chess pieces).
 * Walks outward along a ray from the origin until the point is no longer
 * inside the shape, then refines with binary search.
 */
function sampleBoundaryRadius(
  angleRad: number,
  config: ShapeConfig,
): number {
  const dx = Math.cos(angleRad);
  const dy = Math.sin(angleRad);

  // Walk outward in coarse steps
  const step = 0.02;
  const maxR = 2.0;
  let lo = 0;
  let hi = maxR;

  for (let r = step; r <= maxR; r += step) {
    if (!isInsideShape(r * dx, r * dy, config)) {
      hi = r;
      lo = r - step;
      break;
    }
  }

  // Binary-search refinement (10 iterations => ~0.001 precision)
  for (let i = 0; i < 10; i++) {
    const mid = (lo + hi) * 0.5;
    if (isInsideShape(mid * dx, mid * dy, config)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return (lo + hi) * 0.5;
}

/** Compute the boundary radius for a given angle and config analytically. */
function computeBoundaryRadius(
  angleRad: number,
  config: ShapeConfig,
): number {
  // Chess pieces use sample-based boundary detection
  if (CHESS_PIECE_TYPES.has(config.shape)) {
    return sampleBoundaryRadius(angleRad, config);
  }

  const cosA = Math.cos(angleRad);
  const sinA = Math.sin(angleRad);

  switch (config.shape) {
    case 'oval': {
      // radius = 1 / sqrt((cos/a)^2 + sin^2)
      const ca = cosA / config.aspectRatio;
      return 1 / Math.sqrt(ca * ca + sinA * sinA);
    }

    case 'triangle': {
      // Distance from origin to the edge of the equilateral triangle along angleRad.
      const verts = triangleVertices(config.roundness);
      return rayTriangleBoundary(angleRad, verts);
    }

    case 'rectangle': {
      const halfW = config.aspectRatio;
      const halfH = 1;
      // Distance from origin to edge of axis-aligned rectangle along angle
      const absCos = Math.abs(cosA);
      const absSin = Math.abs(sinA);
      if (absCos < 1e-12) return halfH / absSin;
      if (absSin < 1e-12) return halfW / absCos;
      return Math.min(halfW / absCos, halfH / absSin);
    }

    default:
      return 1e6;
  }
}

/**
 * Find the distance from the origin to the edge of a triangle (defined by
 * three vertices) along a ray at angle `angleRad`.
 */
export function rayTriangleBoundary(
  angleRad: number,
  verts: [number, number][],
): number {
  const dx = Math.cos(angleRad);
  const dy = Math.sin(angleRad);

  let minT = Infinity;

  for (let i = 0; i < 3; i++) {
    const [ax, ay] = verts[i];
    const [bx, by] = verts[(i + 1) % 3];

    const ex = bx - ax;
    const ey = by - ay;

    const denom = dx * ey - dy * ex;
    if (Math.abs(denom) < 1e-12) continue;

    const t = (ax * ey - ay * ex) / denom;
    const u = (ax * dy - ay * dx) / denom;

    if (t > 0 && u >= 0 && u <= 1) {
      minT = Math.min(minT, t);
    }
  }

  return minT === Infinity ? 1 : minT;
}
