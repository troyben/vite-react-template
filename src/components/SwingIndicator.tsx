import React from 'react';
import { Arrow, Arc } from 'react-konva';

interface SwingIndicatorProps {
  x: number;
  y: number;
  width: number;
  height: number;
  openingType: 'Fixed' | 'Casement In' | 'Casement Out' | 'Tilt & Turn' | 'Sliding';
}

export const SwingIndicator: React.FC<SwingIndicatorProps> = ({
  x,
  y,
  width,
  height,
  openingType,
}) => {
  if (openingType !== 'Casement In' && openingType !== 'Casement Out') {
    return null;
  }

  const isInSwing = openingType === 'Casement In';
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const radius = Math.min(width, height) / 3;

  // Arc for the swing path
  const arcRotation = isInSwing ? 45 : 225;

  // Arrow at the end of the swing
  const arrowAngle = isInSwing ? 90 : 270;
  const arrowX = centerX + Math.cos((arrowAngle * Math.PI) / 180) * radius;
  const arrowY = centerY + Math.sin((arrowAngle * Math.PI) / 180) * radius;

  return (
    <>
      <Arc
        x={centerX}
        y={centerY}
        innerRadius={radius - 10}
        outerRadius={radius + 10}
        angle={90}
        rotation={arcRotation}
        stroke={isInSwing ? 'blue' : 'green'}
        strokeWidth={2}
        fill="transparent"
      />
      <Arrow
        points={[
          arrowX - Math.cos((arrowAngle * Math.PI) / 180) * 20,
          arrowY - Math.sin((arrowAngle * Math.PI) / 180) * 20,
          arrowX,
          arrowY,
        ]}
        pointerLength={10}
        pointerWidth={10}
        fill={isInSwing ? 'blue' : 'green'}
        stroke={isInSwing ? 'blue' : 'green'}
        strokeWidth={2}
      />
    </>
  );
};