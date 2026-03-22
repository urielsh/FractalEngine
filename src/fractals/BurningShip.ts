import { Fractal, FractalParameters } from './Fractal';

export class BurningShip extends Fractal {
  getName(): string {
    return 'Burning Ship';
  }

  getDefaultParameters(): FractalParameters {
    return {
      maxIterations: 256,
      escapeRadius: 2.0,
    };
  }

  compute(x: number, y: number): number {
    let real = 0;
    let imag = 0;

    for (let i = 0; i < this.maxIterations; i++) {
      const realAbs = Math.abs(real);
      const imagAbs = Math.abs(imag);

      if (realAbs * realAbs + imagAbs * imagAbs > this.escapeRadius * this.escapeRadius) {
        return i + 1 - Math.log(Math.log(realAbs * realAbs + imagAbs * imagAbs)) / Math.log(2);
      }

      const temp = realAbs * realAbs - imagAbs * imagAbs + x;
      imag = 2 * realAbs * imagAbs + y;
      real = temp;
    }

    return this.maxIterations;
  }
}
