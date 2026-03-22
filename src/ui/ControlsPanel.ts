/**
 * ControlsPanel — generates the HTML template for fractal controls.
 */

/** Shape type options for the dropdown. */
const SHAPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'oval', label: 'Oval' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'pawn', label: 'Chess: Pawn' },
  { value: 'rook', label: 'Chess: Rook' },
  { value: 'bishop', label: 'Chess: Bishop' },
  { value: 'knight', label: 'Chess: Knight' },
  { value: 'queen', label: 'Chess: Queen' },
  { value: 'king', label: 'Chess: King' },
];

const CHESS_PIECES = new Set(['pawn', 'rook', 'bishop', 'knight', 'queen', 'king']);

export { CHESS_PIECES };

export function buildControlsHTML(
  colorSchemes: string[],
  centerX: number = 0,
  centerY: number = 0
): string {
  const colorOptions = colorSchemes
    .map(name => `<option value="${name}">${name}</option>`)
    .join('');

  const shapeOptions = SHAPE_OPTIONS
    .map(o => `<option value="${o.value}">${o.label}</option>`)
    .join('');

  return `
      <div class="drag-handle" aria-hidden="true"><span></span></div>

      <div class="control-group">
        <h3 class="collapsible-header" data-target="section-fractal">Fractal Type</h3>
        <div id="section-fractal" class="collapsible-content">
          <select id="fractal-select">
            <option value="mandelbrot">Mandelbrot Set</option>
            <option value="julia">Julia Set</option>
            <option value="burningship">Burning Ship</option>
            <option value="newton">Newton Fractal</option>
            <option value="lsystem">L-System</option>
          </select>
        </div>
      </div>

      <div class="control-group">
        <h3 class="collapsible-header" data-target="section-color-scheme">Color Scheme</h3>
        <div id="section-color-scheme" class="collapsible-content">
          <select id="color-scheme-select">
            ${colorOptions}
          </select>
        </div>
      </div>

      <div class="control-group">
        <h3 class="collapsible-header" data-target="section-view">View Control</h3>
        <div id="section-view" class="collapsible-content">
          <label>
            Center X:
            <input type="number" id="center-x" value="${centerX}" step="0.01" />
          </label>
          <label>
            Center Y:
            <input type="number" id="center-y" value="${centerY}" step="0.01" />
          </label>
          <label>
            Zoom:
            <input type="range" id="zoom-slider" min="0.1" max="10" value="1" step="0.1" />
            <span id="zoom-value">1</span>x
          </label>
        </div>
      </div>

      <div class="control-group">
        <h3 class="collapsible-header" data-target="section-params">Parameters</h3>
        <div id="section-params" class="collapsible-content">
          <label>
            Max Iterations:
            <input type="number" id="max-iterations" value="256" min="10" max="1000" />
          </label>
          <label>
            Escape Radius:
            <input type="number" id="escape-radius" value="2.0" min="1" max="10" step="0.1" />
          </label>
        </div>
      </div>

      <div class="control-group">
        <h3 class="collapsible-header" data-target="section-color-adjustments">Color Adjustments</h3>
        <div id="section-color-adjustments" class="collapsible-content" style="display:none;">
          <label>
            Hue Offset:
            <input type="range" id="hue-offset" min="0" max="360" value="0" step="1" />
            <span id="hue-offset-value">0</span>&deg;
          </label>
          <label>
            Saturation:
            <input type="range" id="saturation" min="0" max="200" value="100" step="1" />
            <span id="saturation-value">100</span>%
          </label>
          <label>
            Brightness:
            <input type="range" id="brightness" min="0" max="200" value="100" step="1" />
            <span id="brightness-value">100</span>%
          </label>
          <label>
            Contrast:
            <input type="range" id="contrast" min="0" max="200" value="100" step="1" />
            <span id="contrast-value">100</span>%
          </label>
          <label>
            Cycle Speed:
            <input type="range" id="cycle-speed" min="0.1" max="5.0" value="1.0" step="0.1" />
            <span id="cycle-speed-value">1.0</span>x
          </label>
        </div>
      </div>

      <div class="control-group">
        <h3 class="collapsible-header" data-target="section-gradient">Custom Gradient</h3>
        <div id="section-gradient" class="collapsible-content" style="display:none;">
          <div id="gradient-editor-mount"></div>
        </div>
      </div>

      <div class="control-group">
        <h3 class="collapsible-header" data-target="section-shape">Shape Boundaries</h3>
        <div id="section-shape" class="collapsible-content" style="display:none;">
          <label>
            Shape:
            <select id="shape-select">
              ${shapeOptions}
            </select>
          </label>
          <label>
            Mode:
            <select id="shape-mode-select">
              <option value="mask">Mask</option>
              <option value="distortion">Distortion</option>
            </select>
          </label>
          <label id="aspect-ratio-group">
            Aspect Ratio:
            <input type="range" id="shape-aspect-ratio" min="0.2" max="5.0" value="1.0" step="0.1" />
            <span id="shape-aspect-ratio-value">1.0</span>
          </label>
          <label id="roundness-group">
            Roundness:
            <input type="range" id="shape-roundness" min="0" max="1" value="0" step="0.01" />
            <span id="shape-roundness-value">0</span>
          </label>
        </div>
      </div>

      <div class="control-group">
        <button id="render-btn">Render</button>
        <button id="export-btn">Export as Image</button>
        <button id="reset-btn">Reset View</button>
      </div>

      <div class="control-group" style="font-size: 0.85em; opacity: 0.7;">
        <h3>Keyboard Shortcuts</h3>
        <p>+/= Zoom in &nbsp; - Zoom out</p>
        <p>Arrow keys: Pan &nbsp; R: Reset</p>
      </div>
    `;
}
