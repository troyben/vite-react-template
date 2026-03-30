import React from 'react';
import { Arrow } from 'react-konva';

interface OpeningIndicatorProps {
  x: number;
  y: number;
  width: number;
  height: number;
  openingType: 'Fixed' | 'Casement In' | 'Casement Out' | 'Tilt & Turn' | 'Sliding';
}

export const OpeningIndicator: React.FC<OpeningIndicatorProps> = ({
  x,
  y,
  width,
  height,
  openingType,
}) => {
  if (openingType === 'Fixed') {
    return null; // No indicator for fixed panels
  }

  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const arrowSize = 15;

  switch (openingType) {
    case 'Casement In':
      // Arrow pointing inward (left)
      return (
        <Arrow
          points={[
            x - 10, centerY,
            x + arrowSize - 10, centerY,
          ]}
          pointerLength={8}
          pointerWidth={8}
          fill="blue"
          stroke="blue"
          strokeWidth={2}
        />
      );

    case 'Casement Out':
      // Arrow pointing outward (right)
      return (
        <Arrow
          points={[
            x + width + 10, centerY,
            x + width - arrowSize + 10, centerY,
          ]}
          pointerLength={8}
          pointerWidth={8}
          fill="green"
          stroke="green"
          strokeWidth={2}
        />
      );

    case 'Sliding':
      // Horizontal arrows on top and bottom
      return (
        <>
          <Arrow
            points={[
              centerX - arrowSize, y - 10,
              centerX, y - 10,
            ]}
            pointerLength={6}
            pointerWidth={6}
            fill="purple"
            stroke="purple"
            strokeWidth={2}
          />
          <Arrow
            points={[
              centerX + arrowSize, y + height + 10,
              centerX, y + height + 10,
            ]}
            pointerLength={6}
            pointerWidth={6}
            fill="purple"
            stroke="purple"
            strokeWidth={2}
          />
        </>
      );

    case 'Tilt & Turn':
      // Circular arrows indicating rotation
      return (
        <>
          <Arrow
            points={[
              centerX - arrowSize, centerY - arrowSize,
              centerX, centerY,
              centerX + arrowSize, centerY - arrowSize,
            ]}
            pointerLength={6}
            pointerWidth={6}
            fill="orange"
            stroke="orange"
            strokeWidth={2}
            tension={0.5}
          />
          <Arrow
            points={[
              centerX + arrowSize, centerY + arrowSize,
              centerX, centerY,
              centerX - arrowSize, centerY + arrowSize,
            ]}
            pointerLength={6}
            pointerWidth={6}
            fill="orange"
            stroke="orange"
            strokeWidth={2}
            tension={0.5}
          />
        </>
      );

    default:
      return null;
  }
};