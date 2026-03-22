/**
 * Chess piece silhouette hit-testing in normalised [-1, 1] coordinate space.
 * All functions are pure and worker-safe (no DOM references, no side effects).
 */

export type ChessPieceType = 'pawn' | 'rook' | 'bishop' | 'knight' | 'queen' | 'king';

// ---------------------------------------------------------------------------
// Primitive helpers
// ---------------------------------------------------------------------------

/** Circle hit test: returns true when (px, py) is within radius r of (cx, cy). */
function inCircle(px: number, py: number, cx: number, cy: number, r: number): boolean {
  return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
}

/** Axis-aligned rectangle hit test (centre cx,cy  half-extents hw,hh). */
function inRect(px: number, py: number, cx: number, cy: number, hw: number, hh: number): boolean {
  return Math.abs(px - cx) <= hw && Math.abs(py - cy) <= hh;
}

/** Trapezoid hit test — symmetric about x = cx, top width 2*topHW, bottom width 2*botHW. */
function inTrapezoid(
  px: number,
  py: number,
  cx: number,
  topY: number,
  botY: number,
  topHW: number,
  botHW: number,
): boolean {
  if (py > topY || py < botY) return false;
  const t = (py - botY) / (topY - botY); // 0 at bottom, 1 at top
  const hw = botHW + (topHW - botHW) * t;
  return Math.abs(px - cx) <= hw;
}

/** Triangle hit test (three vertices). */
function inTriangle(
  px: number,
  py: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): boolean {
  const d00 = x0 - x2;
  const d01 = x1 - x2;
  const d10 = y0 - y2;
  const d11 = y1 - y2;
  const dpx = px - x2;
  const dpy = py - y2;
  const denom = d00 * d11 - d01 * d10;
  if (denom === 0) return false;
  const inv = 1 / denom;
  const u = (d11 * dpx - d01 * dpy) * inv;
  const v = (d00 * dpy - d10 * dpx) * inv;
  return u >= 0 && v >= 0 && u + v <= 1;
}

/**
 * Winding-number point-in-polygon test.
 * `verts` is an array of [x, y] pairs forming a closed polygon (last edge
 * connects the last vertex back to the first).
 */
function inPolygon(px: number, py: number, verts: readonly [number, number][]): boolean {
  let winding = 0;
  const n = verts.length;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = verts[i];
    const [x1, y1] = verts[(i + 1) % n];
    if (y0 <= py) {
      if (y1 > py) {
        // upward crossing
        if ((x1 - x0) * (py - y0) - (px - x0) * (y1 - y0) > 0) {
          winding++;
        }
      }
    } else {
      if (y1 <= py) {
        // downward crossing
        if ((x1 - x0) * (py - y0) - (px - x0) * (y1 - y0) < 0) {
          winding--;
        }
      }
    }
  }
  return winding !== 0;
}

// ---------------------------------------------------------------------------
// Piece silhouettes
// ---------------------------------------------------------------------------

/**
 * Pawn: small head circle + narrow neck + wider body + rectangular pedestal.
 * Fits in roughly [-0.35, 0.35] x [-0.9, 0.9].
 */
export function isInsidePawn(nx: number, ny: number): boolean {
  // Head (small circle at top)
  if (inCircle(nx, ny, 0, 0.6, 0.18)) return true;
  // Neck (narrow rectangle)
  if (inRect(nx, ny, 0, 0.35, 0.08, 0.12)) return true;
  // Body (wider circle / dome)
  if (inCircle(nx, ny, 0, 0.05, 0.28)) return true;
  // Pedestal (rounded rectangle at bottom)
  if (inRect(nx, ny, 0, -0.55, 0.35, 0.35)) return true;
  return false;
}

/**
 * Rook: rectangular body + 3 crenellations on top + wider base.
 */
export function isInsideRook(nx: number, ny: number): boolean {
  // Main body
  if (inRect(nx, ny, 0, 0.0, 0.28, 0.55)) return true;
  // Left crenellation
  if (inRect(nx, ny, -0.22, 0.7, 0.08, 0.15)) return true;
  // Centre crenellation
  if (inRect(nx, ny, 0, 0.7, 0.08, 0.15)) return true;
  // Right crenellation
  if (inRect(nx, ny, 0.22, 0.7, 0.08, 0.15)) return true;
  // Base (wider rectangle)
  if (inRect(nx, ny, 0, -0.7, 0.38, 0.2)) return true;
  return false;
}

/**
 * Bishop: tapered body + pointed triangular top + small mitre ball.
 */
export function isInsideBishop(nx: number, ny: number): boolean {
  // Mitre ball (small circle at tip)
  if (inCircle(nx, ny, 0, 0.85, 0.08)) return true;
  // Pointed top (triangle)
  if (inTriangle(nx, ny, 0, 0.8, -0.15, 0.4, 0.15, 0.4)) return true;
  // Tapered body (trapezoid: narrower at top, wider at bottom)
  if (inTrapezoid(nx, ny, 0, 0.4, -0.45, 0.15, 0.3)) return true;
  // Base (rectangle)
  if (inRect(nx, ny, 0, -0.65, 0.35, 0.2)) return true;
  return false;
}

/**
 * Knight: horse head profile using ~20-vertex polygon + winding-number test.
 */
const KNIGHT_VERTICES: readonly [number, number][] = [
  // Starting from bottom-left of the base, going clockwise
  [-0.35, -0.85],  // 0  base bottom-left
  [0.35, -0.85],   // 1  base bottom-right
  [0.35, -0.55],   // 2  base top-right
  [0.25, -0.55],   // 3  body start right
  [0.30, -0.15],   // 4  body right
  [0.28, 0.15],    // 5  upper body right
  [0.20, 0.35],    // 6  shoulder right
  [0.15, 0.50],    // 7  neck right
  [0.10, 0.65],    // 8  head back
  [0.05, 0.80],    // 9  ear tip right
  [-0.02, 0.72],   // 10 ear dip
  [-0.10, 0.82],   // 11 ear tip left
  [-0.15, 0.70],   // 12 forehead
  [-0.22, 0.55],   // 13 brow
  [-0.35, 0.45],   // 14 nose bridge
  [-0.40, 0.30],   // 15 nose tip
  [-0.35, 0.20],   // 16 mouth
  [-0.25, 0.10],   // 17 chin
  [-0.20, -0.10],  // 18 throat
  [-0.25, -0.55],  // 19 body left
  [-0.35, -0.55],  // 20 base top-left
];

export function isInsideKnight(nx: number, ny: number): boolean {
  return inPolygon(nx, ny, KNIGHT_VERTICES);
}

/**
 * Queen: tapered body + 5 triangular crown points using polar angle modulo.
 */
export function isInsideQueen(nx: number, ny: number): boolean {
  // Crown: 5 triangular points arranged at top
  // Check if in the crown band (y from 0.4 to 0.9)
  if (ny >= 0.35 && ny <= 0.9 && Math.abs(nx) <= 0.45) {
    // Use polar-like approach: angle from (0, 0.35) determines which "tooth"
    const angle = Math.atan2(nx, ny - 0.35);
    const spread = Math.PI * 0.45; // half angular spread of the crown
    if (Math.abs(angle) <= spread) {
      // 5 teeth: modulate angle
      const toothAngle = (angle + spread) % (2 * spread / 5);
      const toothMid = spread / 5;
      const toothFrac = Math.abs(toothAngle - toothMid) / toothMid;
      // Tooth narrows toward the top: max height when toothFrac is small
      const maxH = 0.9;
      const baseH = 0.45;
      const toothH = maxH - (maxH - baseH) * toothFrac;
      if (ny <= toothH) return true;
    }
  }
  // Tapered body (trapezoid)
  if (inTrapezoid(nx, ny, 0, 0.4, -0.45, 0.2, 0.32)) return true;
  // Base (rectangle)
  if (inRect(nx, ny, 0, -0.65, 0.38, 0.2)) return true;
  return false;
}

/**
 * King: tapered body (same as queen) + cross at top.
 */
export function isInsideKing(nx: number, ny: number): boolean {
  // Cross at top: union of two thin rectangles
  // Vertical bar of cross
  if (inRect(nx, ny, 0, 0.7, 0.06, 0.22)) return true;
  // Horizontal bar of cross
  if (inRect(nx, ny, 0, 0.72, 0.18, 0.06)) return true;
  // Tapered body (trapezoid)
  if (inTrapezoid(nx, ny, 0, 0.5, -0.45, 0.18, 0.32)) return true;
  // Base (rectangle)
  if (inRect(nx, ny, 0, -0.65, 0.38, 0.2)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

/**
 * Returns true when the normalised point (nx, ny) lies inside the silhouette
 * of the given chess piece.
 */
export function isInsideChessPiece(
  nx: number,
  ny: number,
  piece: ChessPieceType,
): boolean {
  switch (piece) {
    case 'pawn':
      return isInsidePawn(nx, ny);
    case 'rook':
      return isInsideRook(nx, ny);
    case 'bishop':
      return isInsideBishop(nx, ny);
    case 'knight':
      return isInsideKnight(nx, ny);
    case 'queen':
      return isInsideQueen(nx, ny);
    case 'king':
      return isInsideKing(nx, ny);
  }
}
