/**
 * EventBindings — wires DOM events and keyboard shortcuts to UIController methods.
 */
import type { UIController } from './UIController';
import { PAN_STEP_BASE, ZOOM_STEP_FACTOR, ZOOM_MIN, ZOOM_MAX } from '../constants';
import { TouchHandler } from './TouchHandler';
import { CHESS_PIECES } from './ControlsPanel';

export function bindControlEvents(controller: UIController): void {
  const fractalSelect = document.getElementById('fractal-select') as HTMLSelectElement;
  const colorSchemeSelect = document.getElementById('color-scheme-select') as HTMLSelectElement;
  const centerXInput = document.getElementById('center-x') as HTMLInputElement;
  const centerYInput = document.getElementById('center-y') as HTMLInputElement;
  const zoomSlider = document.getElementById('zoom-slider') as HTMLInputElement;
  const zoomValue = document.getElementById('zoom-value') as HTMLElement;
  const maxIterationsInput = document.getElementById('max-iterations') as HTMLInputElement;
  const escapeRadiusInput = document.getElementById('escape-radius') as HTMLInputElement;
  const renderBtn = document.getElementById('render-btn') as HTMLButtonElement;
  const exportBtn = document.getElementById('export-btn') as HTMLButtonElement;
  const resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;

  fractalSelect.addEventListener('change', (e) => {
    controller.handleFractalChange((e.target as HTMLSelectElement).value);
  });

  colorSchemeSelect.addEventListener('change', (e) => {
    controller.handleColorSchemeChange((e.target as HTMLSelectElement).value);
  });

  centerXInput.addEventListener('change', (e) => {
    controller.handlePan(
      parseFloat((e.target as HTMLInputElement).value),
      controller.getCenterY()
    );
  });

  centerYInput.addEventListener('change', (e) => {
    controller.handlePan(
      controller.getCenterX(),
      parseFloat((e.target as HTMLInputElement).value)
    );
  });

  zoomSlider.addEventListener('input', (e) => {
    const zoom = parseFloat((e.target as HTMLInputElement).value);
    zoomValue.textContent = zoom.toFixed(1);
    controller.handleZoomChange(zoom);
  });

  maxIterationsInput.addEventListener('change', (e) => {
    controller.handleParameterChange('maxIterations', parseInt((e.target as HTMLInputElement).value));
  });

  escapeRadiusInput.addEventListener('change', (e) => {
    controller.handleParameterChange('escapeRadius', parseFloat((e.target as HTMLInputElement).value));
  });

  // --- Color adjustment sliders ---
  const hueOffsetSlider = document.getElementById('hue-offset') as HTMLInputElement;
  const hueOffsetValue = document.getElementById('hue-offset-value') as HTMLElement;
  const saturationSlider = document.getElementById('saturation') as HTMLInputElement;
  const saturationValue = document.getElementById('saturation-value') as HTMLElement;
  const brightnessSlider = document.getElementById('brightness') as HTMLInputElement;
  const brightnessValue = document.getElementById('brightness-value') as HTMLElement;
  const contrastSlider = document.getElementById('contrast') as HTMLInputElement;
  const contrastValue = document.getElementById('contrast-value') as HTMLElement;
  const cycleSpeedSlider = document.getElementById('cycle-speed') as HTMLInputElement;
  const cycleSpeedValue = document.getElementById('cycle-speed-value') as HTMLElement;

  hueOffsetSlider.addEventListener('input', (e) => {
    const v = parseFloat((e.target as HTMLInputElement).value);
    hueOffsetValue.textContent = String(v);
    controller.handleColorParamsChange({ hueOffset: v });
  });

  saturationSlider.addEventListener('input', (e) => {
    const v = parseFloat((e.target as HTMLInputElement).value);
    saturationValue.textContent = String(v);
    controller.handleColorParamsChange({ saturation: v });
  });

  brightnessSlider.addEventListener('input', (e) => {
    const v = parseFloat((e.target as HTMLInputElement).value);
    brightnessValue.textContent = String(v);
    controller.handleColorParamsChange({ brightness: v });
  });

  contrastSlider.addEventListener('input', (e) => {
    const v = parseFloat((e.target as HTMLInputElement).value);
    contrastValue.textContent = String(v);
    controller.handleColorParamsChange({ contrast: v });
  });

  cycleSpeedSlider.addEventListener('input', (e) => {
    const v = parseFloat((e.target as HTMLInputElement).value);
    cycleSpeedValue.textContent = v.toFixed(1);
    controller.handleColorParamsChange({ cycleSpeed: v });
  });

  // --- Shape boundary controls ---
  const shapeSelect = document.getElementById('shape-select') as HTMLSelectElement | null;
  const shapeModeSelect = document.getElementById('shape-mode-select') as HTMLSelectElement | null;
  const aspectRatioSlider = document.getElementById('shape-aspect-ratio') as HTMLInputElement | null;
  const aspectRatioValue = document.getElementById('shape-aspect-ratio-value') as HTMLElement | null;
  const roundnessSlider = document.getElementById('shape-roundness') as HTMLInputElement | null;
  const roundnessValue = document.getElementById('shape-roundness-value') as HTMLElement | null;
  const aspectRatioGroup = document.getElementById('aspect-ratio-group') as HTMLElement | null;
  const roundnessGroup = document.getElementById('roundness-group') as HTMLElement | null;

  /** Show/hide aspect ratio and roundness controls based on selected shape. */
  function updateShapeSubControls(shape: string): void {
    const isChess = CHESS_PIECES.has(shape);
    const isNone = shape === 'none';
    if (aspectRatioGroup) aspectRatioGroup.style.display = isChess || isNone ? 'none' : '';
    if (roundnessGroup) roundnessGroup.style.display = isChess || isNone ? 'none' : '';
  }

  if (shapeSelect) {
    // Initial visibility update
    updateShapeSubControls(shapeSelect.value);

    shapeSelect.addEventListener('change', () => {
      updateShapeSubControls(shapeSelect.value);
      controller.handleShapeChange({ shape: shapeSelect.value as never });
    });
  }

  if (shapeModeSelect) {
    shapeModeSelect.addEventListener('change', () => {
      controller.handleShapeChange({ mode: shapeModeSelect.value as never });
    });
  }

  if (aspectRatioSlider) {
    aspectRatioSlider.addEventListener('input', () => {
      const v = parseFloat(aspectRatioSlider.value);
      if (aspectRatioValue) aspectRatioValue.textContent = v.toFixed(1);
      controller.handleShapeChange({ aspectRatio: v });
    });
  }

  if (roundnessSlider) {
    roundnessSlider.addEventListener('input', () => {
      const v = parseFloat(roundnessSlider.value);
      if (roundnessValue) roundnessValue.textContent = v.toFixed(2);
      controller.handleShapeChange({ roundness: v });
    });
  }

  renderBtn.addEventListener('click', () => controller.triggerRender());
  exportBtn.addEventListener('click', () => controller.handleExport());
  resetBtn.addEventListener('click', () => controller.handleReset());
}

export function bindKeyboardShortcuts(controller: UIController): void {
  document.addEventListener('keydown', (e) => {
    const tag = (document.activeElement as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

    const panStep = PAN_STEP_BASE / controller.getZoom();

    switch (e.key) {
      case '+':
      case '=':
        controller.handleZoomChange(Math.min(ZOOM_MAX, controller.getZoom() * ZOOM_STEP_FACTOR));
        break;
      case '-':
        controller.handleZoomChange(Math.max(ZOOM_MIN, controller.getZoom() / ZOOM_STEP_FACTOR));
        break;
      case 'ArrowLeft':
        e.preventDefault();
        controller.handlePan(controller.getCenterX() + panStep, controller.getCenterY());
        break;
      case 'ArrowRight':
        e.preventDefault();
        controller.handlePan(controller.getCenterX() - panStep, controller.getCenterY());
        break;
      case 'ArrowUp':
        e.preventDefault();
        controller.handlePan(controller.getCenterX(), controller.getCenterY() + panStep);
        break;
      case 'ArrowDown':
        e.preventDefault();
        controller.handlePan(controller.getCenterX(), controller.getCenterY() - panStep);
        break;
      case 'r':
      case 'R':
        controller.handleReset();
        break;
    }
  });
}

/**
 * Bind touch events (pinch-to-zoom, single-finger pan, double-tap reset) on the
 * given canvas element, delegating to the UIController.
 *
 * Returns the TouchHandler instance so the caller can call `destroy()` if needed.
 */
export function bindTouchEvents(canvas: HTMLElement, controller: UIController): TouchHandler {
  return new TouchHandler(canvas, {
    onZoom(factor: number): void {
      const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, controller.getZoom() * factor));
      controller.handleZoomChange(newZoom);
    },
    onPan(dx: number, dy: number): void {
      // Scale the normalised delta by the visible range (≈3 units) inversely
      // proportional to zoom — same convention as keyboard pan.
      const scale = PAN_STEP_BASE * 10 / controller.getZoom();
      controller.handlePan(
        controller.getCenterX() + dx * scale,
        controller.getCenterY() + dy * scale
      );
    },
    onReset(): void {
      controller.handleReset();
    },
  });
}
