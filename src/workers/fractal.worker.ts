import { computePoint, ComputeParams } from '../fractals/compute';
import { mapColorByName } from '../colors/colorMapping.ts';
import type { ColorParams } from '../colors/ColorParams.ts';
import type { GradientStop } from '../colors/GradientEditor.ts';
import { mapWithGradient } from '../colors/GradientEditor.ts';
import type { ShapeConfig } from '../boundaries/ShapeBoundary.ts';
import { isInsideShape, distortCoordinates } from '../boundaries/ShapeBoundary.ts';

export interface TileTask {
  id: number;
  width: number;
  height: number;
  startY: number;
  endY: number;
  centerX: number;
  centerY: number;
  zoom: number;
  computeParams: ComputeParams;
  colorSchemeName: string;
  colorParams?: ColorParams;
  gradientStops?: GradientStop[];
  shapeConfig?: ShapeConfig;
  distortionLUT?: number[];
}

export interface TileResult {
  id: number;
  startY: number;
  endY: number;
  data: Uint8Array;
}

self.onmessage = (e: MessageEvent<TileTask>) => {
  const task = e.data;
  const {
    width, startY, endY, centerX, centerY, zoom,
    computeParams, colorSchemeName, colorParams,
    gradientStops, shapeConfig, distortionLUT,
  } = task;
  const tileHeight = endY - startY;
  const data = new Uint8Array(width * tileHeight * 4);

  // Convert plain number[] LUT back to Float32Array for distortCoordinates
  const lutTyped = distortionLUT ? new Float32Array(distortionLUT) : undefined;

  for (let y = startY; y < endY; y++) {
    for (let x = 0; x < width; x++) {
      const normalizedX = (x / width) * 2 - 1;
      const normalizedY = (y / task.height) * 2 - 1;

      const index = ((y - startY) * width + x) * 4;

      // Shape boundary: mask mode — skip pixel if outside shape
      if (shapeConfig && shapeConfig.shape !== 'none' && shapeConfig.mode === 'mask') {
        if (!isInsideShape(normalizedX, normalizedY, shapeConfig)) {
          data[index] = 0;
          data[index + 1] = 0;
          data[index + 2] = 0;
          data[index + 3] = 255;
          continue;
        }
      }

      let fracX = (normalizedX - centerX) / zoom;
      let fracY = (normalizedY - centerY) / zoom;

      // Shape boundary: distortion mode — warp coordinates before computing
      if (shapeConfig && shapeConfig.shape !== 'none' && shapeConfig.mode === 'distortion') {
        const distorted = distortCoordinates(normalizedX, normalizedY, shapeConfig, lutTyped);
        fracX = (distorted.x - centerX) / zoom;
        fracY = (distorted.y - centerY) / zoom;
      }

      const iterations = computePoint(fracX, fracY, computeParams);

      // Gradient mapping takes priority when stops are provided
      if (gradientStops && gradientStops.length >= 2) {
        const cycleSpeed = colorParams ? colorParams.cycleSpeed : 1.0;
        const [r, g, b] = mapWithGradient(iterations, computeParams.maxIterations, gradientStops, cycleSpeed);
        data[index] = r;
        data[index + 1] = g;
        data[index + 2] = b;
        data[index + 3] = 255;
      } else {
        const color = mapColorByName(iterations, computeParams.maxIterations, colorSchemeName, colorParams);
        data[index] = color.r;
        data[index + 1] = color.g;
        data[index + 2] = color.b;
        data[index + 3] = 255;
      }
    }
  }

  const result: TileResult = { id: task.id, startY, endY, data };
  (self as unknown as Worker).postMessage(result, [data.buffer]);
};
