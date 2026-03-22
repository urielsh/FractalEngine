/**
 * GradientEditorUI — DOM-based gradient editor panel.
 *
 * Creates an interactive UI with colour-stop pickers, a live preview
 * strip and an enable/disable checkbox.  Every change fires the
 * supplied callback so the host can re-render the fractal.
 */

import type { GradientStop } from '../colors/GradientEditor';
import { interpolateGradient } from '../colors/GradientEditor';

/** Convert an {r,g,b} object (0-255) to a hex colour string. */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Parse a hex colour string (#rrggbb) into {r, g, b}. */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const stripped = hex.replace('#', '');
  return {
    r: parseInt(stripped.substring(0, 2), 16),
    g: parseInt(stripped.substring(2, 4), 16),
    b: parseInt(stripped.substring(4, 6), 16),
  };
}

const MIN_STOPS = 2;
const MAX_STOPS = 4;

const DEFAULT_STOPS: GradientStop[] = [
  { position: 0, color: { r: 0, g: 0, b: 255 } },
  { position: 1, color: { r: 255, g: 0, b: 0 } },
];

export class GradientEditorUI {
  private stops: GradientStop[];
  private enabled: boolean = false;
  private onChangeCallback: (stops: GradientStop[], enabled: boolean) => void;
  private previewCanvas: HTMLCanvasElement | null = null;
  private stopsContainer: HTMLElement | null = null;

  constructor(onChangeCallback: (stops: GradientStop[], enabled: boolean) => void) {
    this.onChangeCallback = onChangeCallback;
    // Deep-clone defaults
    this.stops = DEFAULT_STOPS.map(s => ({
      position: s.position,
      color: { ...s.color },
    }));
  }

  /** Build the editor DOM inside the given container. */
  render(container: HTMLElement): void {
    const wrapper = document.createElement('div');
    wrapper.className = 'control-group gradient-editor';

    // Title
    const heading = document.createElement('h3');
    heading.textContent = 'Custom Gradient';
    wrapper.appendChild(heading);

    // Enable checkbox
    const checkLabel = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'gradient-enabled';
    checkbox.checked = this.enabled;
    checkbox.addEventListener('change', () => {
      this.enabled = checkbox.checked;
      this.fireChange();
    });
    checkLabel.appendChild(checkbox);
    checkLabel.appendChild(document.createTextNode(' Use Custom Gradient'));
    wrapper.appendChild(checkLabel);

    // Stops container
    this.stopsContainer = document.createElement('div');
    this.stopsContainer.id = 'gradient-stops';
    wrapper.appendChild(this.stopsContainer);
    this.rebuildStopRows();

    // Add stop button
    const addBtn = document.createElement('button');
    addBtn.id = 'gradient-add-stop';
    addBtn.textContent = 'Add Stop';
    addBtn.addEventListener('click', () => {
      if (this.stops.length >= MAX_STOPS) return;
      // New stop at the midpoint with white
      this.stops.push({ position: 0.5, color: { r: 255, g: 255, b: 255 } });
      this.rebuildStopRows();
      this.fireChange();
    });
    wrapper.appendChild(addBtn);

    // Preview canvas
    this.previewCanvas = document.createElement('canvas');
    this.previewCanvas.width = 200;
    this.previewCanvas.height = 20;
    this.previewCanvas.id = 'gradient-preview';
    this.previewCanvas.style.display = 'block';
    this.previewCanvas.style.marginTop = '6px';
    this.previewCanvas.style.border = '1px solid #555';
    wrapper.appendChild(this.previewCanvas);

    container.appendChild(wrapper);
    this.updatePreview();
  }

  getStops(): GradientStop[] {
    return this.stops.map(s => ({
      position: s.position,
      color: { ...s.color },
    }));
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /* ------------------------------------------------------------------ */
  /*  Private helpers                                                    */
  /* ------------------------------------------------------------------ */

  private rebuildStopRows(): void {
    const container = this.stopsContainer;
    if (!container) return;
    container.innerHTML = '';

    this.stops.forEach((stop, index) => {
      const row = document.createElement('div');
      row.className = 'gradient-stop-row';
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '4px';
      row.style.marginTop = '4px';

      // Colour picker
      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.value = rgbToHex(stop.color.r, stop.color.g, stop.color.b);
      colorInput.addEventListener('input', () => {
        this.stops[index].color = hexToRgb(colorInput.value);
        this.fireChange();
      });
      row.appendChild(colorInput);

      // Position slider
      const posSlider = document.createElement('input');
      posSlider.type = 'range';
      posSlider.min = '0';
      posSlider.max = '1';
      posSlider.step = '0.01';
      posSlider.value = String(stop.position);
      posSlider.style.flex = '1';
      posSlider.addEventListener('input', () => {
        this.stops[index].position = parseFloat(posSlider.value);
        this.fireChange();
      });
      row.appendChild(posSlider);

      // Remove button (disabled when at minimum)
      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'X';
      removeBtn.disabled = this.stops.length <= MIN_STOPS;
      removeBtn.addEventListener('click', () => {
        if (this.stops.length <= MIN_STOPS) return;
        this.stops.splice(index, 1);
        this.rebuildStopRows();
        this.fireChange();
      });
      row.appendChild(removeBtn);

      container.appendChild(row);
    });
  }

  private updatePreview(): void {
    if (!this.previewCanvas) return;
    const ctx = this.previewCanvas.getContext('2d');
    if (!ctx) return;
    const w = this.previewCanvas.width;
    const h = this.previewCanvas.height;
    for (let x = 0; x < w; x++) {
      const t = x / (w - 1);
      const rgb = interpolateGradient(t, this.stops);
      ctx.fillStyle = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
      ctx.fillRect(x, 0, 1, h);
    }
  }

  private fireChange(): void {
    this.updatePreview();
    this.onChangeCallback(this.getStops(), this.enabled);
  }
}
