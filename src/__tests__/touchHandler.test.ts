// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TouchHandler, TouchCallbacks } from '../ui/TouchHandler';

// ---------------------------------------------------------------------------
// Helpers to build mock Touch / TouchEvent objects compatible with jsdom
// ---------------------------------------------------------------------------

function makeTouchObj(overrides: Partial<Touch> = {}): Touch {
  return {
    identifier: 0,
    target: null as unknown as EventTarget,
    clientX: 0,
    clientY: 0,
    pageX: 0,
    pageY: 0,
    screenX: 0,
    screenY: 0,
    radiusX: 0,
    radiusY: 0,
    rotationAngle: 0,
    force: 0,
    ...overrides,
  };
}

interface MockTouchEventInit {
  touches?: Touch[];
  changedTouches?: Touch[];
}

function makeTouchEvent(type: string, init: MockTouchEventInit = {}): TouchEvent {
  const touches = init.touches ?? [];
  const changedTouches = init.changedTouches ?? [];

  // We cannot construct a real TouchEvent in Node/jsdom, so we fabricate one.
  const evt = new Event(type, { bubbles: true, cancelable: true }) as unknown as TouchEvent & {
    touches: Touch[];
    changedTouches: Touch[];
  };
  Object.defineProperty(evt, 'touches', { value: touches });
  Object.defineProperty(evt, 'changedTouches', { value: changedTouches });
  Object.defineProperty(evt, 'preventDefault', { value: vi.fn() });
  return evt;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TouchHandler', () => {
  let canvas: HTMLDivElement;
  let onZoom: ReturnType<typeof vi.fn>;
  let onPan: ReturnType<typeof vi.fn>;
  let onReset: ReturnType<typeof vi.fn>;
  let handler: TouchHandler;

  beforeEach(() => {
    canvas = document.createElement('div');
    // Give the canvas a measurable size (clientWidth/clientHeight are 0 in jsdom,
    // so we explicitly stub them).
    Object.defineProperty(canvas, 'clientWidth', { value: 400, configurable: true });
    Object.defineProperty(canvas, 'clientHeight', { value: 300, configurable: true });

    onZoom = vi.fn();
    onPan = vi.fn();
    onReset = vi.fn();
    const callbacks = { onZoom, onPan, onReset } as unknown as TouchCallbacks;

    handler = new TouchHandler(canvas, callbacks);
  });

  afterEach(() => {
    handler.destroy();
  });

  // ---- Pinch-to-zoom ratio calculation ----

  describe('pinch-to-zoom', () => {
    it('calls onZoom with the correct scale ratio', () => {
      // Start a two-finger pinch 100 px apart
      const t1Start = makeTouchObj({ identifier: 0, clientX: 100, clientY: 100 });
      const t2Start = makeTouchObj({ identifier: 1, clientX: 200, clientY: 100 });
      canvas.dispatchEvent(
        makeTouchEvent('touchstart', { touches: [t1Start, t2Start] }),
      );

      // Move fingers apart to 200 px distance (double the initial)
      const t1Move = makeTouchObj({ identifier: 0, clientX: 50, clientY: 100 });
      const t2Move = makeTouchObj({ identifier: 1, clientX: 250, clientY: 100 });
      canvas.dispatchEvent(
        makeTouchEvent('touchmove', { touches: [t1Move, t2Move] }),
      );

      expect(onZoom).toHaveBeenCalledTimes(1);
      // Initial distance = 100, new distance = 200 -> scale = 2.0
      expect(onZoom).toHaveBeenCalledWith(2.0);
    });

    it('updates baseline distance after each move for incremental zooming', () => {
      const t1 = makeTouchObj({ identifier: 0, clientX: 0, clientY: 0 });
      const t2 = makeTouchObj({ identifier: 1, clientX: 100, clientY: 0 });
      canvas.dispatchEvent(makeTouchEvent('touchstart', { touches: [t1, t2] }));

      // First move: 100 -> 200 (ratio 2)
      const t1m1 = makeTouchObj({ identifier: 0, clientX: 0, clientY: 0 });
      const t2m1 = makeTouchObj({ identifier: 1, clientX: 200, clientY: 0 });
      canvas.dispatchEvent(makeTouchEvent('touchmove', { touches: [t1m1, t2m1] }));

      // Second move: baseline should now be 200, move to 300 (ratio 1.5)
      const t1m2 = makeTouchObj({ identifier: 0, clientX: 0, clientY: 0 });
      const t2m2 = makeTouchObj({ identifier: 1, clientX: 300, clientY: 0 });
      canvas.dispatchEvent(makeTouchEvent('touchmove', { touches: [t1m2, t2m2] }));

      expect(onZoom).toHaveBeenCalledTimes(2);
      expect(onZoom).toHaveBeenNthCalledWith(1, 2.0);
      expect(onZoom).toHaveBeenNthCalledWith(2, 1.5);
    });

    it('does not call onZoom when initial pinch distance is 0', () => {
      // Both fingers at the same point -> distance = 0
      const t1 = makeTouchObj({ identifier: 0, clientX: 100, clientY: 100 });
      const t2 = makeTouchObj({ identifier: 1, clientX: 100, clientY: 100 });
      canvas.dispatchEvent(makeTouchEvent('touchstart', { touches: [t1, t2] }));

      // Move one finger
      const t1m = makeTouchObj({ identifier: 0, clientX: 100, clientY: 100 });
      const t2m = makeTouchObj({ identifier: 1, clientX: 200, clientY: 100 });
      canvas.dispatchEvent(makeTouchEvent('touchmove', { touches: [t1m, t2m] }));

      // initialPinchDistance was 0, so the guard prevents division-by-zero/zoom
      expect(onZoom).not.toHaveBeenCalled();
    });
  });

  // ---- Single-finger pan delta normalization ----

  describe('single-finger pan', () => {
    it('normalizes pixel deltas to fractional canvas units', () => {
      const t = makeTouchObj({ identifier: 0, clientX: 200, clientY: 150 });
      canvas.dispatchEvent(makeTouchEvent('touchstart', { touches: [t] }));

      // Move 40 px right, 30 px down
      const tMoved = makeTouchObj({ identifier: 0, clientX: 240, clientY: 180 });
      canvas.dispatchEvent(makeTouchEvent('touchmove', { touches: [tMoved] }));

      expect(onPan).toHaveBeenCalledTimes(1);
      // dx = -(40/400) = -0.1, dy = -(30/300) = -0.1
      const [dx, dy] = onPan.mock.calls[0];
      expect(dx).toBeCloseTo(-0.1);
      expect(dy).toBeCloseTo(-0.1);
    });

    it('produces zero delta when the finger does not move', () => {
      const t = makeTouchObj({ identifier: 0, clientX: 100, clientY: 100 });
      canvas.dispatchEvent(makeTouchEvent('touchstart', { touches: [t] }));

      const tSame = makeTouchObj({ identifier: 0, clientX: 100, clientY: 100 });
      canvas.dispatchEvent(makeTouchEvent('touchmove', { touches: [tSame] }));

      expect(onPan).toHaveBeenCalledTimes(1);
      const [dx, dy] = onPan.mock.calls[0];
      expect(dx).toBeCloseTo(0);
      expect(dy).toBeCloseTo(0);
    });

    it('does not trigger pan when a pinch gesture is active', () => {
      // Start with two fingers (pinch)
      const t1 = makeTouchObj({ identifier: 0, clientX: 100, clientY: 100 });
      const t2 = makeTouchObj({ identifier: 1, clientX: 200, clientY: 100 });
      canvas.dispatchEvent(makeTouchEvent('touchstart', { touches: [t1, t2] }));

      // Lift one finger but isPinching is still true until touchend clears it
      // Simulate a single-finger move while isPinching=true
      const tMove = makeTouchObj({ identifier: 0, clientX: 150, clientY: 150 });
      canvas.dispatchEvent(makeTouchEvent('touchmove', { touches: [tMove] }));

      expect(onPan).not.toHaveBeenCalled();
    });
  });

  // ---- Double-tap detection timing ----

  describe('double-tap detection', () => {
    it('fires onReset when two taps occur within 300 ms', () => {
      // First tap
      const t1 = makeTouchObj({ identifier: 0, clientX: 100, clientY: 100 });
      canvas.dispatchEvent(makeTouchEvent('touchstart', { touches: [t1] }));
      canvas.dispatchEvent(
        makeTouchEvent('touchend', { touches: [], changedTouches: [t1] }),
      );

      // Second tap immediately
      canvas.dispatchEvent(makeTouchEvent('touchstart', { touches: [t1] }));
      canvas.dispatchEvent(
        makeTouchEvent('touchend', { touches: [], changedTouches: [t1] }),
      );

      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it('does not fire onReset if taps are > 300 ms apart', () => {
      const t1 = makeTouchObj({ identifier: 0, clientX: 100, clientY: 100 });
      canvas.dispatchEvent(makeTouchEvent('touchstart', { touches: [t1] }));
      canvas.dispatchEvent(
        makeTouchEvent('touchend', { touches: [], changedTouches: [t1] }),
      );

      // Simulate time passing beyond the 300 ms window
      const origDateNow = Date.now;
      const firstTapTime = Date.now();
      Date.now = vi.fn(() => firstTapTime + 500);

      canvas.dispatchEvent(makeTouchEvent('touchstart', { touches: [t1] }));
      canvas.dispatchEvent(
        makeTouchEvent('touchend', { touches: [], changedTouches: [t1] }),
      );

      expect(onReset).not.toHaveBeenCalled();
      Date.now = origDateNow;
    });

    it('does not fire onReset if the finger moved significantly (>= 15 px)', () => {
      const tStart = makeTouchObj({ identifier: 0, clientX: 100, clientY: 100 });
      canvas.dispatchEvent(makeTouchEvent('touchstart', { touches: [tStart] }));

      // End far from start — should not count as a tap
      const tEnd = makeTouchObj({ identifier: 0, clientX: 120, clientY: 100 });
      canvas.dispatchEvent(
        makeTouchEvent('touchend', { touches: [], changedTouches: [tEnd] }),
      );

      // Second tap at same point
      canvas.dispatchEvent(makeTouchEvent('touchstart', { touches: [tStart] }));
      canvas.dispatchEvent(
        makeTouchEvent('touchend', { touches: [], changedTouches: [tStart] }),
      );

      // First event wasn't a "tap" because the finger moved >= 15 px
      expect(onReset).not.toHaveBeenCalled();
    });

    it('does not fire onReset during a pinch gesture', () => {
      // Start a pinch
      const t1 = makeTouchObj({ identifier: 0, clientX: 100, clientY: 100 });
      const t2 = makeTouchObj({ identifier: 1, clientX: 200, clientY: 100 });
      canvas.dispatchEvent(makeTouchEvent('touchstart', { touches: [t1, t2] }));

      // Lift both fingers — isPinching is still true
      canvas.dispatchEvent(
        makeTouchEvent('touchend', { touches: [], changedTouches: [t2] }),
      );

      expect(onReset).not.toHaveBeenCalled();
    });

    it('triple-tap does not re-fire onReset because lastTapTime is cleared', () => {
      const t = makeTouchObj({ identifier: 0, clientX: 100, clientY: 100 });

      // Tap 1
      canvas.dispatchEvent(makeTouchEvent('touchstart', { touches: [t] }));
      canvas.dispatchEvent(makeTouchEvent('touchend', { touches: [], changedTouches: [t] }));
      // Tap 2 -> triggers reset
      canvas.dispatchEvent(makeTouchEvent('touchstart', { touches: [t] }));
      canvas.dispatchEvent(makeTouchEvent('touchend', { touches: [], changedTouches: [t] }));
      // Tap 3 -> should NOT re-fire because lastTapTime was set to 0
      canvas.dispatchEvent(makeTouchEvent('touchstart', { touches: [t] }));
      canvas.dispatchEvent(makeTouchEvent('touchend', { touches: [], changedTouches: [t] }));

      expect(onReset).toHaveBeenCalledTimes(1);
    });
  });

  // ---- destroy() cleanup ----

  describe('destroy()', () => {
    it('removes all three touch event listeners', () => {
      const removeSpy = vi.spyOn(canvas, 'removeEventListener');

      handler.destroy();

      expect(removeSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
      expect(removeSpy).toHaveBeenCalledWith('touchmove', expect.any(Function));
      expect(removeSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
      expect(removeSpy).toHaveBeenCalledTimes(3);
    });

    it('restores touch-action style to empty string', () => {
      // The constructor sets touch-action to 'none'
      expect(canvas.style.touchAction).toBe('none');

      handler.destroy();

      expect(canvas.style.touchAction).toBe('');
    });

    it('no longer dispatches callbacks after destroy', () => {
      handler.destroy();

      const t = makeTouchObj({ identifier: 0, clientX: 100, clientY: 100 });
      canvas.dispatchEvent(makeTouchEvent('touchstart', { touches: [t] }));

      const tMoved = makeTouchObj({ identifier: 0, clientX: 150, clientY: 150 });
      canvas.dispatchEvent(makeTouchEvent('touchmove', { touches: [tMoved] }));

      canvas.dispatchEvent(
        makeTouchEvent('touchend', { touches: [], changedTouches: [t] }),
      );

      expect(onZoom).not.toHaveBeenCalled();
      expect(onPan).not.toHaveBeenCalled();
      expect(onReset).not.toHaveBeenCalled();
    });
  });

  // ---- Constructor side-effects ----

  describe('constructor', () => {
    function makeMockCallbacks(): TouchCallbacks {
      return { onZoom: vi.fn(), onPan: vi.fn(), onReset: vi.fn() } as unknown as TouchCallbacks;
    }

    it('sets touch-action to "none" on the canvas', () => {
      const el = document.createElement('div');
      const h = new TouchHandler(el, makeMockCallbacks());
      expect(el.style.touchAction).toBe('none');
      h.destroy();
    });

    it('registers three event listeners on the canvas', () => {
      const el = document.createElement('div');
      const addSpy = vi.spyOn(el, 'addEventListener');
      const h = new TouchHandler(el, makeMockCallbacks());
      expect(addSpy).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: false });
      expect(addSpy).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: false });
      expect(addSpy).toHaveBeenCalledWith('touchend', expect.any(Function), { passive: false });
      h.destroy();
    });
  });
});
