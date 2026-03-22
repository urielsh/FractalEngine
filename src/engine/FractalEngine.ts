import {
  Fractal,
  MandelbrotSet,
  JuliaSet,
  BurningShip,
  NewtonFractal,
  LSystemFractal,
  FractalParameters,
} from '../fractals/index';
import { ColorScheme, classicHsl, getColorSchemeByName, colorSchemes } from '../colors/ColorScheme';
import { ComputeParams, FractalType } from '../fractals/compute';
import { ColorParams, DEFAULT_COLOR_PARAMS } from '../colors/ColorParams';
import type { GradientStop } from '../colors/GradientEditor';
import type { ShapeConfig } from '../boundaries/ShapeBoundary';
import { defaultShapeConfig, isInsideShape, distortCoordinates } from '../boundaries/ShapeBoundary';
import { buildLUT } from '../boundaries/DistortionLUT';

export class FractalEngine {
  private fractalMap: Map<string, Fractal> = new Map();
  private currentFractal: Fractal;
  private parameters: FractalParameters;
  private colorScheme: ColorScheme = classicHsl;
  private colorParams: ColorParams = { ...DEFAULT_COLOR_PARAMS };
  private gradientStops: GradientStop[] = [];
  private gradientEnabled: boolean = false;
  private shapeConfig: ShapeConfig = defaultShapeConfig();
  private distortionLUT: number[] = [];

  constructor() {
    // Register all fractal types
    this.fractalMap.set('mandelbrot', new MandelbrotSet());
    this.fractalMap.set('julia', new JuliaSet());
    this.fractalMap.set('burningship', new BurningShip());
    this.fractalMap.set('newton', new NewtonFractal());
    this.fractalMap.set('lsystem', new LSystemFractal());

    // Set default fractal
    this.currentFractal = this.fractalMap.get('mandelbrot')!;
    this.parameters = this.currentFractal.getDefaultParameters();
  }

  setFractalType(name: string): void {
    const fractal = this.fractalMap.get(name.toLowerCase());
    if (fractal) {
      this.currentFractal = fractal;
      this.parameters = this.currentFractal.getDefaultParameters();
    }
  }

  setParameter(key: string, value: number | string): void {
    this.parameters[key] = value;
  }

  getParameters(): FractalParameters {
    return { ...this.parameters };
  }

  getCurrentFractal(): Fractal {
    return this.currentFractal;
  }

  setColorScheme(name: string): void {
    const scheme = getColorSchemeByName(name);
    if (scheme) {
      this.colorScheme = scheme;
    }
  }

  getColorScheme(): ColorScheme {
    return this.colorScheme;
  }

  getAvailableColorSchemes(): string[] {
    return colorSchemes.map(s => s.name);
  }

  setColorParams(params: Partial<ColorParams>): void {
    this.colorParams = { ...this.colorParams, ...params };
  }

  getColorParams(): ColorParams {
    return { ...this.colorParams };
  }

  setGradient(stops: GradientStop[], enabled: boolean): void {
    this.gradientStops = stops;
    this.gradientEnabled = enabled;
  }

  getGradientStops(): GradientStop[] {
    return this.gradientStops;
  }

  isGradientEnabled(): boolean {
    return this.gradientEnabled;
  }

  setShapeConfig(config: ShapeConfig): void {
    this.shapeConfig = { ...config };
    this.rebuildLUT();
  }

  getShapeConfig(): ShapeConfig {
    return { ...this.shapeConfig };
  }

  getDistortionLUT(): number[] {
    return this.distortionLUT;
  }

  /** Precompute the distortion LUT for the current shape config. */
  private rebuildLUT(): void {
    if (this.shapeConfig.shape === 'none') {
      this.distortionLUT = [];
      return;
    }
    const float32 = buildLUT(this.shapeConfig);
    // Convert Float32Array to plain number[] for structured-clone transfer to workers
    this.distortionLUT = Array.from(float32);
  }

  computeFractal(
    x: number,
    y: number,
    centerX: number = 0,
    centerY: number = 0,
    zoom: number = 1
  ): number {
    const scaledX = (x - centerX) / zoom;
    const scaledY = (y - centerY) / zoom;
    return this.currentFractal.compute(scaledX, scaledY);
  }

  generateFractalData(
    width: number,
    height: number,
    centerX: number = 0,
    centerY: number = 0,
    zoom: number = 1
  ): Uint8Array {
    const data = new Uint8Array(width * height * 4);
    const hasShape = this.shapeConfig.shape !== 'none';
    const isMask = this.shapeConfig.mode === 'mask';
    const lut = hasShape && !isMask && this.distortionLUT.length > 0
      ? new Float32Array(this.distortionLUT)
      : undefined;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let normalizedX = (x / width) * 2 - 1; // -1 to 1
        let normalizedY = (y / height) * 2 - 1; // -1 to 1

        // Shape boundary handling
        if (hasShape) {
          if (isMask) {
            // Mask mode: pixels outside the shape are black
            if (!isInsideShape(normalizedX, normalizedY, this.shapeConfig)) {
              const index = (y * width + x) * 4;
              data[index] = 0;
              data[index + 1] = 0;
              data[index + 2] = 0;
              data[index + 3] = 255;
              continue;
            }
          } else {
            // Distortion mode: warp coordinates before computing fractal
            const distorted = distortCoordinates(normalizedX, normalizedY, this.shapeConfig, lut);
            normalizedX = distorted.x;
            normalizedY = distorted.y;
          }
        }

        const iterations = this.computeFractal(normalizedX, normalizedY, centerX, centerY, zoom);
        const color = this.colorScheme.map(iterations, this.parameters.maxIterations as number, this.colorParams);

        const index = (y * width + x) * 4;
        data[index] = color.r;
        data[index + 1] = color.g;
        data[index + 2] = color.b;
        data[index + 3] = 255;
      }
    }

    return data;
  }

  getCurrentFractalType(): FractalType {
    for (const [key, fractal] of this.fractalMap.entries()) {
      if (fractal === this.currentFractal) return key as FractalType;
    }
    return 'mandelbrot';
  }

  getComputeParams(): ComputeParams {
    const params = this.getParameters();
    const type = this.getCurrentFractalType();
    const result: ComputeParams = {
      fractalType: type,
      maxIterations: params.maxIterations as number,
      escapeRadius: params.escapeRadius as number,
    };
    if (type === 'julia') {
      const julia = this.currentFractal as JuliaSet;
      result.cReal = julia.cReal;
      result.cImag = julia.cImag;
    }
    return result;
  }
}
