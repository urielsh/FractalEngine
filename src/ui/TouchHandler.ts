/**
 * TouchHandler — provides pinch-to-zoom, single-finger pan, and double-tap reset
 * for touch-enabled devices.
 */

export interface TouchCallbacks {
  onZoom(factor: number): void;
  onPan(dx: number, dy: number): void;
  onReset(): void;
}

export class TouchHandler {
  private canvas: HTMLElement;
  private callbacks: TouchCallbacks;

  /** Distance between two fingers at the start of a pinch gesture. */
  private initialPinchDistance: number = 0;

  /** Position of the single-finger touch on the previous move event. */
  private lastSingleTouchX: number = 0;
  private lastSingleTouchY: number = 0;

  /** Timestamp of the most recent tap (touchend with minimal movement). */
  private lastTapTime: number = 0;

  /** Position recorded at touchstart for tap detection. */
  private touchStartX: number = 0;
  private touchStartY: number = 0;

  /** Whether the current gesture involves two fingers (pinch). */
  private isPinching: boolean = false;

  // Bound handler references for clean removal
  private readonly handleTouchStart: (e: TouchEvent) => void;
  private readonly handleTouchMove: (e: TouchEvent) => void;
  private readonly handleTouchEnd: (e: TouchEvent) => void;

  constructor(canvas: HTMLElement, callbacks: TouchCallbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;

    // Disable browser default touch behaviours (scroll, zoom) on the canvas
    this.canvas.style.touchAction = 'none';

    // Bind handlers so we can remove them later
    this.handleTouchStart = this.onTouchStart.bind(this);
    this.handleTouchMove = this.onTouchMove.bind(this);
    this.handleTouchEnd = this.onTouchEnd.bind(this);

    this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });
  }

  // ---------------------------------------------------------------------------
  // Touch event handlers
  // ---------------------------------------------------------------------------

  private onTouchStart(e: TouchEvent): void {
    e.preventDefault();

    if (e.touches.length === 2) {
      // Start of pinch gesture
      this.isPinching = true;
      this.initialPinchDistance = this.getTouchDistance(e.touches[0], e.touches[1]);
    } else if (e.touches.length === 1) {
      this.isPinching = false;
      const touch = e.touches[0];
      this.lastSingleTouchX = touch.clientX;
      this.lastSingleTouchY = touch.clientY;
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
    }
  }

  private onTouchMove(e: TouchEvent): void {
    e.preventDefault();

    if (e.touches.length === 2 && this.isPinching) {
      // Pinch-to-zoom
      const currentDistance = this.getTouchDistance(e.touches[0], e.touches[1]);
      if (this.initialPinchDistance > 0) {
        const scaleDelta = currentDistance / this.initialPinchDistance;
        this.callbacks.onZoom(scaleDelta);
        // Update baseline so subsequent moves are incremental
        this.initialPinchDistance = currentDistance;
      }
    } else if (e.touches.length === 1 && !this.isPinching) {
      // Single-finger pan
      const touch = e.touches[0];
      const rawDx = touch.clientX - this.lastSingleTouchX;
      const rawDy = touch.clientY - this.lastSingleTouchY;

      // Convert pixel movement to fractal-coordinate delta.
      // We divide by canvas dimensions and also inversely by the current zoom
      // (higher zoom means smaller coordinate change per pixel).
      const canvasWidth = this.canvas.clientWidth || 1;
      const canvasHeight = this.canvas.clientHeight || 1;

      // Fractal visible range is roughly 3 units wide at zoom=1.
      // Normalise so a full-width drag moves 3/zoom fractal units.
      const dx = -(rawDx / canvasWidth);
      const dy = -(rawDy / canvasHeight);

      this.callbacks.onPan(dx, dy);

      this.lastSingleTouchX = touch.clientX;
      this.lastSingleTouchY = touch.clientY;
    }
  }

  private onTouchEnd(e: TouchEvent): void {
    e.preventDefault();

    // Double-tap detection: only on full release of a single-finger tap
    if (e.touches.length === 0 && e.changedTouches.length === 1 && !this.isPinching) {
      const ct = e.changedTouches[0];
      const movedX = Math.abs(ct.clientX - this.touchStartX);
      const movedY = Math.abs(ct.clientY - this.touchStartY);

      // Only count as a "tap" if the finger barely moved (< 15 px)
      if (movedX < 15 && movedY < 15) {
        const now = Date.now();
        if (now - this.lastTapTime < 300) {
          this.callbacks.onReset();
          this.lastTapTime = 0; // reset so triple-tap doesn't re-fire
        } else {
          this.lastTapTime = now;
        }
      }
    }

    // Reset pinch state when fewer than 2 fingers remain
    if (e.touches.length < 2) {
      this.isPinching = false;
      this.initialPinchDistance = 0;
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Euclidean distance between two Touch points. */
  private getTouchDistance(t1: Touch, t2: Touch): number {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /** Remove all event listeners and restore touch-action. */
  destroy(): void {
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    this.canvas.style.touchAction = '';
  }
}
