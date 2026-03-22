// Pure computation functions for use in both main thread and Web Workers.
// These have no class dependencies and can be transferred to worker contexts.

export function computeMandelbrot(x: number, y: number, maxIterations: number, escapeRadius: number): number {
  let real = x;
  let imag = y;
  let iterations = 0;
  const er2 = escapeRadius * escapeRadius;

  for (let i = 0; i < maxIterations; i++) {
    const realSq = real * real;
    const imagSq = imag * imag;

    if (realSq + imagSq > er2) {
      return iterations + 1 - Math.log(Math.log(realSq + imagSq)) / Math.log(2);
    }

    const temp = realSq - imagSq + x;
    imag = 2 * real * imag + y;
    real = temp;
    iterations++;
  }

  return iterations;
}

export function computeJulia(x: number, y: number, maxIterations: number, escapeRadius: number, cReal: number, cImag: number): number {
  let real = x;
  let imag = y;
  const er2 = escapeRadius * escapeRadius;

  for (let i = 0; i < maxIterations; i++) {
    const realSq = real * real;
    const imagSq = imag * imag;

    if (realSq + imagSq > er2) {
      return i + 1 - Math.log(Math.log(realSq + imagSq)) / Math.log(2);
    }

    const temp = realSq - imagSq + cReal;
    imag = 2 * real * imag + cImag;
    real = temp;
  }

  return maxIterations;
}

export function computeBurningShip(x: number, y: number, maxIterations: number, escapeRadius: number): number {
  let real = 0;
  let imag = 0;
  const er2 = escapeRadius * escapeRadius;

  for (let i = 0; i < maxIterations; i++) {
    const realAbs = Math.abs(real);
    const imagAbs = Math.abs(imag);

    if (realAbs * realAbs + imagAbs * imagAbs > er2) {
      return i + 1 - Math.log(Math.log(realAbs * realAbs + imagAbs * imagAbs)) / Math.log(2);
    }

    const temp = realAbs * realAbs - imagAbs * imagAbs + x;
    imag = 2 * realAbs * imagAbs + y;
    real = temp;
  }

  return maxIterations;
}

export function computeNewton(x: number, y: number, maxIterations: number): number {
  let real = x;
  let imag = y;

  for (let i = 0; i < maxIterations; i++) {
    const r2 = real * real + imag * imag;
    if (r2 < 0.001) return i;

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

  return maxIterations;
}

export type FractalType = 'mandelbrot' | 'julia' | 'burningship' | 'newton' | 'lsystem';

export interface ComputeParams {
  fractalType: FractalType;
  maxIterations: number;
  escapeRadius: number;
  cReal?: number;
  cImag?: number;
}

export function computePoint(x: number, y: number, params: ComputeParams): number {
  switch (params.fractalType) {
    case 'mandelbrot':
      return computeMandelbrot(x, y, params.maxIterations, params.escapeRadius);
    case 'julia':
      return computeJulia(x, y, params.maxIterations, params.escapeRadius, params.cReal ?? -0.7, params.cImag ?? 0.27015);
    case 'burningship':
      return computeBurningShip(x, y, params.maxIterations, params.escapeRadius);
    case 'newton':
      return computeNewton(x, y, params.maxIterations);
    case 'lsystem':
      return 0; // L-System uses separate rendering path
    default:
      return 0;
  }
}
