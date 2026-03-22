import { mapClassicHsl, mapFire, mapOcean, mapGrayscale, mapNeon } from './colorMapping.ts';
import type { ColorParams } from './ColorParams.ts';

export interface ColorScheme {
  name: string;
  map(iterations: number, maxIterations: number, colorParams?: ColorParams): { r: number; g: number; b: number };
}

export const classicHsl: ColorScheme = {
  name: 'Classic HSL',
  map: mapClassicHsl,
};

export const fire: ColorScheme = {
  name: 'Fire',
  map: mapFire,
};

export const ocean: ColorScheme = {
  name: 'Ocean',
  map: mapOcean,
};

export const grayscale: ColorScheme = {
  name: 'Grayscale',
  map: mapGrayscale,
};

export const neon: ColorScheme = {
  name: 'Neon',
  map: mapNeon,
};

export const colorSchemes: ColorScheme[] = [classicHsl, fire, ocean, grayscale, neon];

export function getColorSchemeByName(name: string): ColorScheme | undefined {
  return colorSchemes.find(s => s.name === name);
}
