import type { ShapeConfig } from './types';

/** Rotate the L outline clockwise, including its overall and cutout dimensions. */
export function rotateLShape(shape: ShapeConfig, width: number, height: number) {
  if (shape.type !== 'l-shape') return { shape, width, height };
  const corners = ['top-right', 'bottom-right', 'bottom-left', 'top-left'] as const;
  const corner = corners.indexOf(shape.cutoutPosition ?? 'top-right');
  return {
    width: height,
    height: width,
    shape: {
      ...shape,
      cutoutPosition: corners[(corner + 1) % corners.length],
      cutoutWidth: shape.cutoutHeight ?? height * 0.4,
      cutoutHeight: shape.cutoutWidth ?? width * 0.4,
    },
  };
}
