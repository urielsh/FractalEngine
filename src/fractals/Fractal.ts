export interface FractalParameters {
  maxIterations: number;
  escapeRadius: number;
  [key: string]: number | string;
}

export abstract class Fractal {
  maxIterations: number = 256;
  escapeRadius: number = 2.0;

  abstract compute(x: number, y: number): number;
  abstract getName(): string;
  abstract getDefaultParameters(): FractalParameters;

  /**
   * Override this for fractals that render via geometry (e.g., L-Systems)
   * instead of per-pixel computation. Returns true if it handled rendering.
   */
  renderToCanvas(_ctx: CanvasRenderingContext2D, _width: number, _height: number): boolean {
    return false;
  }
}
