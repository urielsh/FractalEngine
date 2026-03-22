import { Fractal, FractalParameters } from './Fractal';
import { NEWTON_CONVERGENCE_THRESHOLD } from '../constants';

export class NewtonFractal extends Fractal {
  getName(): string {
    return 'Newton Fractal';
  }

  getDefaultParameters(): FractalParameters {
    return {
      maxIterations: 256,
      escapeRadius: 2.0,
    };
  }

  compute(x: number, y: number): number {
    let real = x;
    let imag = y;

    for (let i = 0; i < this.maxIterations; i++) {
      // Compute z^3 - 1
      const r2 = real * real + imag * imag;
      if (r2 < NEWTON_CONVERGENCE_THRESHOLD) return i;

      // Newton's method for z^3 - 1 = 0
      const numeratorReal = real * real * real - 3 * real * imag * imag - 1;
      const numeratorImag = 3 * real * real * imag - imag * imag * imag;

      const denominatorReal = 3 * (real * real - imag * imag);
      const denominatorImag = 6 * real * imag;

      const denom = denominatorReal * denominatorReal + denominatorImag * denominatorImag;
      if (denom === 0) return i;

      const nextReal = real - (numeratorReal * denominatorReal + numeratorImag * denominatorImag) / denom;
      const nextImag = imag - (numeratorImag * denominatorReal - numeratorReal * denominatorImag) / denom;

      real = nextReal;
      imag = nextImag;
    }

    return this.maxIterations;
  }
}
