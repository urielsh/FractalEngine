/**
 * Pre-computed look-up table for boundary radius at every 0.5 degrees.
 * Used by distortCoordinates for fast per-pixel distortion.
 *
 * All functions are pure and worker-safe (no DOM references).
 */

import type { ShapeConfig } from './ShapeBoundary';
import { CHESS_PIECE_TYPES, triangleVertices, rayTriangleBoundary } from './ShapeBoundary';
import { isInsideChessPiece, type ChessPieceType } from './ChessPieces.ts';

const LUT_SIZE = 720; // 360 degrees / 0.5 degree step
const DEG_PER_ENTRY = 0.5;
const DEG_TO_RAD = Math.PI / 180;

// ---------------------------------------------------------------------------
// Boundary radius computation per angle
// ---------------------------------------------------------------------------

/**
 * Sample-based boundary radius for chess pieces.
 * Walks outward along a ray from the origin, then refines with binary search.
 */
function sampleChessBoundary(
  angleRad: number,
  piece: ChessPieceType,
): number {
  const dx = Math.cos(angleRad);
  const dy = Math.sin(angleRad);
  const step = 0.02;
  const maxR = 2.0;
  let lo = 0;
  let hi = maxR;

  for (let r = step; r <= maxR; r += step) {
    if (!isInsideChessPiece(r * dx, r * dy, piece)) {
      hi = r;
      lo = r - step;
      break;
    }
  }

  for (let i = 0; i < 10; i++) {
    const mid = (lo + hi) * 0.5;
    if (isInsideChessPiece(mid * dx, mid * dy, piece)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return (lo + hi) * 0.5;
}

function boundaryRadiusAtAngle(
  angleDeg: number,
  config: ShapeConfig,
): number {
  const rad = angleDeg * DEG_TO_RAD;

  // Chess pieces: use sampling approach
  if (CHESS_PIECE_TYPES.has(config.shape)) {
    return sampleChessBoundary(rad, config.shape as ChessPieceType);
  }

  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);

  switch (config.shape) {
    case 'none':
      return 1e6;

    case 'oval': {
      const ca = cosA / config.aspectRatio;
      return 1 / Math.sqrt(ca * ca + sinA * sinA);
    }

    case 'triangle': {
      const verts = triangleVertices(config.roundness);
      return rayTriangleBoundary(rad, verts);
    }

    case 'rectangle': {
      const halfW = config.aspectRatio;
      const halfH = 1;
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build a 720-entry Float32Array look-up table of boundary radii.
 * Entry `i` corresponds to angle `i * 0.5` degrees.
 */
export function buildLUT(config: ShapeConfig): Float32Array {
  const lut = new Float32Array(LUT_SIZE);
  for (let i = 0; i < LUT_SIZE; i++) {
    lut[i] = boundaryRadiusAtAngle(i * DEG_PER_ENTRY, config);
  }
  return lut;
}

/**
 * Look up the boundary radius at an arbitrary angle (in degrees) using
 * linear interpolation between adjacent LUT entries.
 */
export function lookupLUT(
  lut: Float32Array,
  angleDegrees: number,
): number {
  // Normalise to [0, 360)
  let deg = angleDegrees % 360;
  if (deg < 0) deg += 360;

  const idx = deg / DEG_PER_ENTRY; // continuous index
  const i0 = Math.floor(idx) % LUT_SIZE;
  const i1 = (i0 + 1) % LUT_SIZE;
  const frac = idx - Math.floor(idx);

  return lut[i0] * (1 - frac) + lut[i1] * frac;
}
