import { Fractal, FractalParameters } from './Fractal';

export class MandelbrotSet extends Fractal {
  getName(): string {
    return 'Mandelbrot Set';
  }

  getDefaultParameters(): FractalParameters {
    return {
      maxIterations: 256,
      escapeRadius: 2.0,
      centerX: -0.7,
      centerY: 0,
      zoom: 1,
    };
  }

  compute(x: number, y: number): number {
    let real = x;
    let imag = y;
    let iterations = 0;

    for (let i = 0; i < this.maxIterations; i++) {
      const realSq = real * real;
      const imagSq = imag * imag;

      if (realSq + imagSq > this.escapeRadius * this.escapeRadius) {
        return iterations + 1 - Math.log(Math.log(realSq + imagSq)) / Math.log(2);
      }

      const temp = realSq - imagSq + x;
      imag = 2 * real * imag + y;
      real = temp;
      iterations++;
    }

    return iterations;
  }
}
