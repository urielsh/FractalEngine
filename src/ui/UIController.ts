import { FractalEngine } from '../engine/FractalEngine';
import { FractalRenderer } from '../renderer/FractalRenderer';
import { buildControlsHTML } from './ControlsPanel';
import { bindControlEvents, bindKeyboardShortcuts } from './EventBindings';
import type { ColorParams } from '../colors/ColorParams';
import type { GradientStop } from '../colors/GradientEditor';
import { GradientEditorUI } from './GradientEditorUI';
import type { ShapeConfig, BoundaryMode, ShapeType } from '../boundaries/ShapeBoundary';

export class UIController {
  private engine: FractalEngine;
  private renderer: FractalRenderer;
  private controlsContainer: HTMLElement;
  private centerX: number = 0;
  private centerY: number = 0;
  private zoom: number = 1;
  private gradientEditor: GradientEditorUI;

  constructor(engine: FractalEngine, renderer: FractalRenderer) {
    this.engine = engine;
    this.renderer = renderer;
    this.controlsContainer = document.getElementById('controls') as HTMLElement;

    this.controlsContainer.innerHTML = buildControlsHTML(
      this.engine.getAvailableColorSchemes(),
      this.centerX,
      this.centerY
    );

    // Initialize gradient editor
    this.gradientEditor = new GradientEditorUI((stops: GradientStop[], enabled: boolean) => {
      this.handleGradientChange(stops, enabled);
    });
    const gradientMount = document.getElementById('gradient-editor-mount');
    if (gradientMount) {
      this.gradientEditor.render(gradientMount);
    }

    // Initialize collapsible sections
    this.initCollapsibleSections();

    bindControlEvents(this);
    bindKeyboardShortcuts(this);
    this.render();
  }

  getCenterX(): number { return this.centerX; }
  getCenterY(): number { return this.centerY; }
  getZoom(): number { return this.zoom; }

  handleFractalChange(name: string): void {
    this.engine.setFractalType(name);
    this.updateShapeVisibility();
    this.render();
  }

  handleColorSchemeChange(name: string): void {
    this.engine.setColorScheme(name);
    this.render();
  }

  handleZoomChange(zoom: number): void {
    this.zoom = zoom;
    this.updateUIValues();
    this.render();
  }

  handlePan(x: number, y: number): void {
    this.centerX = x;
    this.centerY = y;
    this.updateUIValues();
    this.render();
  }

  handleColorParamsChange(params: Partial<ColorParams>): void {
    this.engine.setColorParams(params);
    this.render();
  }

  handleParameterChange(key: string, value: number | string): void {
    this.engine.setParameter(key, value);
    this.render();
  }

  handleGradientChange(stops: GradientStop[], enabled: boolean): void {
    this.engine.setGradient(stops, enabled);
    this.render();
  }

  handleShapeChange(config: Partial<ShapeConfig>): void {
    const current = this.engine.getShapeConfig();
    const merged: ShapeConfig = {
      shape: (config.shape ?? current.shape) as ShapeType,
      mode: (config.mode ?? current.mode) as BoundaryMode,
      aspectRatio: config.aspectRatio ?? current.aspectRatio,
      roundness: config.roundness ?? current.roundness,
    };
    this.engine.setShapeConfig(merged);
    this.render();
  }

  handleReset(): void {
    this.centerX = 0;
    this.centerY = 0;
    this.zoom = 1;
    this.updateUIValues();
    this.render();
  }

  handleExport(): void {
    const canvas = this.renderer.getCanvas();
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('UIController: Export failed — canvas.toBlob returned null.');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const fractalName = this.engine.getCurrentFractal().getName().toLowerCase().replace(/\s+/g, '-');
      a.href = url;
      a.download = `fractal-${fractalName}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  triggerRender(): void {
    this.render();
  }

  private initCollapsibleSections(): void {
    const headers = this.controlsContainer.querySelectorAll('.collapsible-header');
    headers.forEach(header => {
      header.addEventListener('click', () => {
        const targetId = (header as HTMLElement).dataset.target;
        if (!targetId) return;
        const content = document.getElementById(targetId);
        if (!content) return;
        const isHidden = content.style.display === 'none';
        content.style.display = isHidden ? '' : 'none';
        header.classList.toggle('collapsed', !isHidden);
      });
    });
  }

  /** Hide distortion mode and aspect/roundness controls when L-System is selected or for chess pieces. */
  private updateShapeVisibility(): void {
    const isLSystem = this.engine.getCurrentFractalType() === 'lsystem';
    const modeSelect = document.getElementById('shape-mode-select') as HTMLSelectElement | null;
    if (modeSelect) {
      const distortionOption = modeSelect.querySelector('option[value="distortion"]') as HTMLOptionElement | null;
      if (distortionOption) {
        distortionOption.disabled = isLSystem;
      }
      // Force mask mode for L-Systems
      if (isLSystem && modeSelect.value === 'distortion') {
        modeSelect.value = 'mask';
        this.handleShapeChange({ mode: 'mask' });
      }
    }
  }

  private updateUIValues(): void {
    const centerXInput = document.getElementById('center-x') as HTMLInputElement;
    const centerYInput = document.getElementById('center-y') as HTMLInputElement;
    const zoomSlider = document.getElementById('zoom-slider') as HTMLInputElement;
    const zoomValue = document.getElementById('zoom-value') as HTMLElement;

    if (centerXInput) centerXInput.value = this.centerX.toFixed(4);
    if (centerYInput) centerYInput.value = this.centerY.toFixed(4);
    if (zoomSlider) zoomSlider.value = this.zoom.toFixed(1);
    if (zoomValue) zoomValue.textContent = this.zoom.toFixed(1);
  }

  private render(): void {
    this.renderer.renderFractal(this.engine, this.centerX, this.centerY, this.zoom);
  }
}
