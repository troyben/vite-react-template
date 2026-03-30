import React from 'react';
import { Line, Circle } from 'react-konva';
import { useCanvasStore } from '@/stores/canvasStore';

interface PolygonShapeProps {
  id: string;
  points: number[];
}

export const PolygonShape: React.FC<PolygonShapeProps> = ({ id, points }) => {
  const { updatePolygonPoint } = useCanvasStore();

  const handlePointDrag = (index: number, x: number, y: number) => {
    updatePolygonPoint(id, index, x, y);
  };

  return (
    <>
      <Line
        points={points}
        stroke="black"
        strokeWidth={2}
        closed={true}
        fill="transparent"
      />
      {points.map((point, index) => {
        if (index % 2 === 0) {
          const x = point;
          const y = points[index + 1];
          return (
            <Circle
              key={index / 2}
              x={x}
              y={y}
              radius={5}
              fill="red"
              draggable
              onDragEnd={(e) => handlePointDrag(index / 2, e.target.x(), e.target.y())}
            />
          );
        }
        return null;
      })}
    </>
  );
};