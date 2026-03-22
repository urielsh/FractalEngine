import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildControlsHTML } from '../ui/ControlsPanel';
import type { FractalEngine } from '../engine/FractalEngine';
import type { FractalRenderer } from '../renderer/FractalRenderer';

// ---- ControlsPanel HTML generation ----

describe('buildControlsHTML', () => {
  const schemes = ['Classic HSL', 'Fire', 'Ocean'];

  it('contains the fractal type dropdown', () => {
    const html = buildControlsHTML(schemes);
    expect(html).toContain('id="fractal-select"');
    expect(html).toContain('<option value="mandelbrot">Mandelbrot Set</option>');
    expect(html).toContain('<option value="julia">Julia Set</option>');
    expect(html).toContain('<option value="burningship">Burning Ship</option>');
  });

  it('contains the color scheme dropdown with provided schemes', () => {
    const html = buildControlsHTML(schemes);
    expect(html).toContain('id="color-scheme-select"');
    expect(html).toContain('<option value="Classic HSL">Classic HSL</option>');
    expect(html).toContain('<option value="Fire">Fire</option>');
    expect(html).toContain('<option value="Ocean">Ocean</option>');
  });

  it('contains the zoom slider', () => {
    const html = buildControlsHTML(schemes);
    expect(html).toContain('id="zoom-slider"');
    expect(html).toContain('id="zoom-value"');
  });

  it('contains max iterations and escape radius inputs', () => {
    const html = buildControlsHTML(schemes);
    expect(html).toContain('id="max-iterations"');
    expect(html).toContain('id="escape-radius"');
  });

  it('contains render, export and reset buttons', () => {
    const html = buildControlsHTML(schemes);
    expect(html).toContain('id="render-btn"');
    expect(html).toContain('id="export-btn"');
    expect(html).toContain('id="reset-btn"');
  });

  it('renders center X and Y inputs with provided values', () => {
    const html = buildControlsHTML(schemes, 1.5, -2.3);
    expect(html).toContain('id="center-x"');
    expect(html).toContain('value="1.5"');
    expect(html).toContain('id="center-y"');
    expect(html).toContain('value="-2.3"');
  });
});

// ---- UIController state transitions ----

describe('UIController state transitions', () => {
  let renderCalls: Array<{ centerX: number; centerY: number; zoom: number }>;
  let origDoc: typeof globalThis.document;

  function installMockDocument() {
    origDoc = globalThis.document;

    const elements: Record<string, Record<string, unknown>> = {};

    /** Create a minimal mock DOM element with the methods used by the UI code. */
    function mockElement(): Record<string, unknown> {
      const el: Record<string, unknown> = {
        innerHTML: '',
        value: '',
        textContent: '',
        className: '',
        style: { display: '', flex: '', marginTop: '', border: '' },
        dataset: {},
        href: '',
        download: '',
        checked: false,
        disabled: false,
        type: '',
        id: '',
        min: '',
        max: '',
        step: '',
        children: [],
        addEventListener: vi.fn(),
        appendChild: vi.fn(),
        click: vi.fn(),
        querySelectorAll: vi.fn(() => []),
        querySelector: vi.fn(() => null),
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
          toggle: vi.fn(),
          contains: vi.fn(() => false),
        },
        getContext: vi.fn(() => null),
      };
      return el;
    }

    const mockGetElementById = vi.fn((id: string) => {
      if (!elements[id]) {
        elements[id] = mockElement();
      }
      return elements[id];
    });

    (globalThis as Record<string, unknown>).document = {
      getElementById: mockGetElementById,
      addEventListener: vi.fn(),
      createElement: vi.fn(() => mockElement()),
      createTextNode: vi.fn((text: string) => ({ textContent: text })),
      activeElement: { tagName: 'BODY' },
    };
  }

  function restoreDocument() {
    (globalThis as Record<string, unknown>).document = origDoc;
  }

  beforeEach(() => {
    vi.resetModules();
    installMockDocument();
    renderCalls = [];
  });

  afterEach(() => {
    restoreDocument();
  });

  async function createController() {
    const { UIController } = await import('../ui/UIController');

    const mockEngine = {
      getAvailableColorSchemes: () => ['Classic HSL'],
      setFractalType: vi.fn(),
      setColorScheme: vi.fn(),
      setParameter: vi.fn(),
      setColorParams: vi.fn(),
      setGradient: vi.fn(),
      setShapeConfig: vi.fn(),
      getColorParams: () => ({ hueOffset: 0, saturation: 100, brightness: 100, contrast: 100, cycleSpeed: 1 }),
      getShapeConfig: () => ({ shape: 'none', mode: 'mask', aspectRatio: 1, roundness: 0 }),
      getDistortionLUT: () => [],
      isGradientEnabled: () => false,
      getGradientStops: () => [],
      getCurrentFractal: () => ({ getName: () => 'Mandelbrot Set' }),
      getCurrentFractalType: () => 'mandelbrot',
    };

    const mockRenderer = {
      renderFractal: vi.fn((_e: unknown, cx: number, cy: number, z: number) => {
        renderCalls.push({ centerX: cx, centerY: cy, zoom: z });
      }),
      getCanvas: () => ({
        toBlob: vi.fn(),
      }),
    };

    const controller = new UIController(
      mockEngine as unknown as FractalEngine,
      mockRenderer as unknown as FractalRenderer,
    );

    return { controller, mockEngine, mockRenderer };
  }

  it('initializes with default state (0, 0, 1)', async () => {
    const { controller } = await createController();
    expect(controller.getCenterX()).toBe(0);
    expect(controller.getCenterY()).toBe(0);
    expect(controller.getZoom()).toBe(1);
  });

  it('handleZoomChange updates zoom state', async () => {
    const { controller } = await createController();
    controller.handleZoomChange(3.5);
    expect(controller.getZoom()).toBe(3.5);
  });

  it('handlePan updates centerX and centerY', async () => {
    const { controller } = await createController();
    controller.handlePan(1.2, -0.5);
    expect(controller.getCenterX()).toBeCloseTo(1.2);
    expect(controller.getCenterY()).toBeCloseTo(-0.5);
  });

  it('handleReset restores default state', async () => {
    const { controller } = await createController();
    controller.handlePan(5, 5);
    controller.handleZoomChange(8);
    controller.handleReset();
    expect(controller.getCenterX()).toBe(0);
    expect(controller.getCenterY()).toBe(0);
    expect(controller.getZoom()).toBe(1);
  });

  it('handleFractalChange delegates to engine', async () => {
    const { controller, mockEngine } = await createController();
    controller.handleFractalChange('julia');
    expect(mockEngine.setFractalType).toHaveBeenCalledWith('julia');
  });

  it('each state mutation triggers a render', async () => {
    const { controller } = await createController();
    const before = renderCalls.length;
    controller.handleZoomChange(2);
    expect(renderCalls.length).toBe(before + 1);
    controller.handlePan(1, 1);
    expect(renderCalls.length).toBe(before + 2);
  });
});
