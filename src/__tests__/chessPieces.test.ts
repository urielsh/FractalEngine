import { describe, it, expect } from 'vitest';
import {
  isInsidePawn,
  isInsideRook,
  isInsideBishop,
  isInsideKnight,
  isInsideQueen,
  isInsideKing,
  isInsideChessPiece,
} from '../boundaries/ChessPieces';
import { isInsideShape, type ShapeConfig } from '../boundaries/ShapeBoundary';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function chessConfig(piece: 'pawn' | 'rook' | 'bishop' | 'knight' | 'queen' | 'king'): ShapeConfig {
  return { shape: piece, mode: 'mask', aspectRatio: 1, roundness: 0 };
}

// ---------------------------------------------------------------------------
// Per-piece tests: centre inside, far point outside
// ---------------------------------------------------------------------------

describe('isInsidePawn', () => {
  it('center (0, 0) is inside', () => {
    expect(isInsidePawn(0, 0)).toBe(true);
  });
  it('far point (5, 5) is outside', () => {
    expect(isInsidePawn(5, 5)).toBe(false);
  });
});

describe('isInsideRook', () => {
  it('center (0, 0) is inside', () => {
    expect(isInsideRook(0, 0)).toBe(true);
  });
  it('far point (5, 5) is outside', () => {
    expect(isInsideRook(5, 5)).toBe(false);
  });
});

describe('isInsideBishop', () => {
  it('center (0, 0) is inside', () => {
    expect(isInsideBishop(0, 0)).toBe(true);
  });
  it('far point (5, 5) is outside', () => {
    expect(isInsideBishop(5, 5)).toBe(false);
  });
});

describe('isInsideKnight', () => {
  it('center (0, 0) is inside', () => {
    expect(isInsideKnight(0, 0)).toBe(true);
  });
  it('far point (5, 5) is outside', () => {
    expect(isInsideKnight(5, 5)).toBe(false);
  });
});

describe('isInsideQueen', () => {
  it('center (0, 0) is inside', () => {
    expect(isInsideQueen(0, 0)).toBe(true);
  });
  it('far point (5, 5) is outside', () => {
    expect(isInsideQueen(5, 5)).toBe(false);
  });
});

describe('isInsideKing', () => {
  it('center (0, 0) is inside', () => {
    expect(isInsideKing(0, 0)).toBe(true);
  });
  it('far point (5, 5) is outside', () => {
    expect(isInsideKing(5, 5)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

describe('isInsideChessPiece dispatcher', () => {
  it('dispatches correctly for all piece types', () => {
    const pieces = ['pawn', 'rook', 'bishop', 'knight', 'queen', 'king'] as const;
    for (const piece of pieces) {
      expect(isInsideChessPiece(0, 0, piece)).toBe(true);
      expect(isInsideChessPiece(5, 5, piece)).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Integration with ShapeBoundary
// ---------------------------------------------------------------------------

describe('chess pieces through isInsideShape', () => {
  it('all chess ShapeTypes work via isInsideShape', () => {
    const pieces = ['pawn', 'rook', 'bishop', 'knight', 'queen', 'king'] as const;
    for (const piece of pieces) {
      const cfg = chessConfig(piece);
      expect(isInsideShape(0, 0, cfg)).toBe(true);
      expect(isInsideShape(5, 5, cfg)).toBe(false);
    }
  });
});
