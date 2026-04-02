import React from 'react';
import { Text } from 'react-konva';

interface MeasurementLabelProps {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export const MeasurementLabel: React.FC<MeasurementLabelProps> = ({ x, y, width, height, scale }) => {
  const widthMm = Math.round(width * scale);
  const heightMm = Math.round(height * scale);

  return (
    <>
      {/* Width label */}
      <Text
        x={x + width / 2 - 20}
        y={y - 20}
        text={`${widthMm}mm`}
        fontSize={12}
        fontStyle="bold"
        fill="black"
        align="center"
      />
      {/* Height label */}
      <Text
        x={x - 40}
        y={y + height / 2 - 6}
        text={`${heightMm}mm`}
        fontSize={12}
        fontStyle="bold"
        fill="black"
        rotation={-90}
        align="center"
      />
    </>
  );
};