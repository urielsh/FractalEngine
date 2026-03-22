import { Fractal, FractalParameters } from './Fractal';

export class JuliaSet extends Fractal {
  cReal: number = -0.7;
  cImag: number = 0.27015;

  getName(): string {
    return 'Julia Set';
  }

  getDefaultParameters(): FractalParameters {
    return {
      maxIterations: 256,
      escapeRadius: 2.0,
      cReal: -0.7,
      cImag: 0.27015,
    };
  }

  compute(x: number, y: number): number {
    let real = x;
    let imag = y;

    for (let i = 0; i < this.maxIterations; i++) {
      const realSq = real * real;
      const imagSq = imag * imag;

      if (realSq + imagSq > this.escapeRadius * this.escapeRadius) {
        return i + 1 - Math.log(Math.log(realSq + imagSq)) / Math.log(2);
      }

      const temp = realSq - imagSq + this.cReal;
      imag = 2 * real * imag + this.cImag;
      real = temp;
    }

    return this.maxIterations;
  }
}
