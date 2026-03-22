import * as THREE from 'three';
import { FractalEngine } from '../engine/FractalEngine';
import { WorkerPool } from '../workers/WorkerPool';
import { TileTask, TileResult } from '../workers/fractal.worker';
import { TILE_HEIGHT_PX, DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT, BREAKPOINT_MOBILE } from '../constants';
import { isInsideShape } from '../boundaries/ShapeBoundary';

/**
 * Returns the optimal canvas resolution for the given CSS viewport dimensions,
 * accounting for devicePixelRatio (capped at 2x to avoid GPU/memory pressure
 * on ultra-high-DPI panels).
 */
export function getOptimalResolution(
  viewportWidth: number,
  viewportHeight: number
): { width: number; height: number } {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  return {
    width: Math.round(viewportWidth * dpr),
    height: Math.round(viewportHeight * dpr),
  };
}

/**
 * Returns a reduced maxIterations value for mobile viewports (width < 600 px)
 * to keep frame times acceptable on lower-powered GPUs / CPUs.
 */
export function getMobileMaxIterations(defaultMaxIter: number): number {
  if (window.innerWidth < BREAKPOINT_MOBILE) {
    return Math.round(defaultMaxIter * 0.5);
  }
  return defaultMaxIter;
}

export class FractalRenderer {
  private scene: THREE.Scene;
  private texture: THREE.Texture;
  private mesh: THREE.Mesh;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  readonly degraded: boolean = false;
  private workerPool: WorkerPool;
  private tileIdCounter = 0;

  constructor(scene: THREE.Scene, _renderer: THREE.WebGLRenderer) {
    this.scene = scene;

    // Create canvas for fractal rendering
    this.canvas = document.createElement('canvas');
    this.canvas.width = DEFAULT_CANVAS_WIDTH;
    this.canvas.height = DEFAULT_CANVAS_HEIGHT;
    this.ctx = this.canvas.getContext('2d');

    if (!this.ctx) {
      console.error('FractalRenderer: Failed to acquire 2D canvas context. Rendering will be degraded.');
      this.degraded = true;
    }

    // Create texture from canvas
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;

    // Create material and mesh
    const material = new THREE.MeshBasicMaterial({ map: this.texture });
    const geometry = new THREE.PlaneGeometry(2, 1.5);
    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);

    // Initialize worker pool
    this.workerPool = new WorkerPool();
  }

  renderFractal(engine: FractalEngine, centerX: number = 0, centerY: number = 0, zoom: number = 1): void {
    // Cancel any in-flight render
    this.workerPool.cancel();

    // L-Systems use their own canvas rendering path
    const fractal = engine.getCurrentFractal();
    if (this.ctx && fractal.renderToCanvas(this.ctx, this.canvas.width, this.canvas.height)) {
      // Apply mask clipping for L-Systems via ctx.clip()
      const shapeConfig = engine.getShapeConfig();
      if (shapeConfig.shape !== 'none' && shapeConfig.mode === 'mask') {
        this.applyLSystemMask(engine);
      }
      this.texture.needsUpdate = true;
      return;
    }

    if (this.workerPool.isAvailable) {
      this.renderWithWorkers(engine, centerX, centerY, zoom);
    } else {
      this.renderMainThread(engine, centerX, centerY, zoom);
    }
  }

  /**
   * Apply shape mask to an already-rendered L-System canvas using a pixel-level
   * compositing approach. Pixels outside the shape boundary are set to black.
   */
  private applyLSystemMask(engine: FractalEngine): void {
    if (!this.ctx) return;
    const { width, height } = this.canvas;
    const shapeConfig = engine.getShapeConfig();
    const imageData = this.ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = (x / width) * 2 - 1;
        const ny = (y / height) * 2 - 1;
        if (!isInsideShape(nx, ny, shapeConfig)) {
          const i = (y * width + x) * 4;
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
          // Keep alpha at 255
        }
      }
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  private renderWithWorkers(engine: FractalEngine, centerX: number, centerY: number, zoom: number): void {
    const { width, height } = this.canvas;
    const computeParams = engine.getComputeParams();
    const colorSchemeName = engine.getColorScheme().name;
    const colorParams = engine.getColorParams();
    const shapeConfig = engine.getShapeConfig();
    const distortionLUT = engine.getDistortionLUT();
    const gradientStops = engine.isGradientEnabled() ? engine.getGradientStops() : undefined;
    const tasks: TileTask[] = [];

    for (let y = 0; y < height; y += TILE_HEIGHT_PX) {
      const endY = Math.min(y + TILE_HEIGHT_PX, height);
      tasks.push({
        id: this.tileIdCounter++,
        width,
        height,
        startY: y,
        endY,
        centerX,
        centerY,
        zoom,
        computeParams,
        colorSchemeName,
        colorParams,
        gradientStops,
        shapeConfig: shapeConfig.shape !== 'none' ? shapeConfig : undefined,
        distortionLUT: distortionLUT.length > 0 ? distortionLUT : undefined,
      });
    }

    this.workerPool.processTiles(
      tasks,
      (result: TileResult) => this.applyTile(result),
      () => {} // all done — tiles already applied progressively
    );
  }

  private applyTile(result: TileResult): void {
    if (!this.ctx) return;
    const tileHeight = result.endY - result.startY;
    const clampedData = new Uint8ClampedArray(result.data);
    const imageData = new ImageData(clampedData, this.canvas.width, tileHeight);
    this.ctx.putImageData(imageData, 0, result.startY);
    this.texture.needsUpdate = true;
  }

  private renderMainThread(engine: FractalEngine, centerX: number, centerY: number, zoom: number): void {
    const data = engine.generateFractalData(this.canvas.width, this.canvas.height, centerX, centerY, zoom);
    const clampedData = new Uint8ClampedArray(data);
    const imageData = new ImageData(clampedData, this.canvas.width, this.canvas.height);
    if (this.ctx) {
      this.ctx.putImageData(imageData, 0, 0);
      this.texture.needsUpdate = true;
    }
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  setResolution(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    (this.mesh.material as THREE.MeshBasicMaterial).map = this.texture;
    (this.mesh.material as THREE.MeshBasicMaterial).needsUpdate = true;
  }
}
