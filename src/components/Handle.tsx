import React from 'react';
import { Circle, Rect } from 'react-konva';
import { useCanvasStore } from '@/stores/canvasStore';

interface HandleProps {
  shapeId: string;
  handle: {
    id: string;
    type: 'casement' | 'sliding' | 'tilt-turn' | 'fixed';
    position: { x: number; y: number };
    side: 'left' | 'right' | 'top' | 'bottom';
  };
  panelX: number;
  panelY: number;
  panelWidth: number;
  panelHeight: number;
}

export const Handle: React.FC<HandleProps> = ({
  shapeId,
  handle,
  panelX,
  panelY,
  panelWidth,
  panelHeight,
}) => {
  const { updateHandle } = useCanvasStore();

  // Convert relative position to absolute coordinates
  const absX = panelX + handle.position.x * panelWidth;
  const absY = panelY + handle.position.y * panelHeight;

  const handleDragEnd = (e: any) => {
    const newAbsX = e.target.x();
    const newAbsY = e.target.y();

    // Calculate relative position within panel bounds
    let relX = (newAbsX - panelX) / panelWidth;
    let relY = (newAbsY - panelY) / panelHeight;

    // Snap to edges with some tolerance
    const snapTolerance = 0.1; // 10% of panel dimension

    // Snap to left/right edges
    if (relX < snapTolerance) relX = 0;
    else if (relX > 1 - snapTolerance) relX = 1;

    // Snap to top/bottom edges
    if (relY < snapTolerance) relY = 0;
    else if (relY > 1 - snapTolerance) relY = 1;

    // Clamp to bounds
    relX = Math.max(0, Math.min(1, relX));
    relY = Math.max(0, Math.min(1, relY));

    updateHandle(shapeId, handle.id, { x: relX, y: relY });
  };

  const renderHandleIcon = () => {
    const size = 12;
    const strokeWidth = 2;

    switch (handle.type) {
      case 'casement':
        // L-shaped handle for casement windows
        return (
          <>
            <Rect
              x={absX - size/2}
              y={absY - size/2}
              width={size}
              height={size/2}
              fill="white"
              stroke="black"
              strokeWidth={strokeWidth}
              cornerRadius={2}
            />
            <Rect
              x={absX - size/2}
              y={absY - size/2}
              width={size/2}
              height={size}
              fill="white"
              stroke="black"
              strokeWidth={strokeWidth}
              cornerRadius={2}
            />
          </>
        );

      case 'sliding':
        // Horizontal bar for sliding windows
        return (
          <Rect
            x={absX - size}
            y={absY - size/4}
            width={size * 2}
            height={size/2}
            fill="white"
            stroke="black"
            strokeWidth={strokeWidth}
            cornerRadius={1}
          />
        );

      case 'tilt-turn':
        // T-shaped handle for tilt & turn windows
        return (
          <>
            <Rect
              x={absX - size/2}
              y={absY - size/2}
              width={size}
              height={size/3}
              fill="white"
              stroke="black"
              strokeWidth={strokeWidth}
              cornerRadius={1}
            />
            <Rect
              x={absX - size/6}
              y={absY - size/2}
              width={size/3}
              height={size}
              fill="white"
              stroke="black"
              strokeWidth={strokeWidth}
              cornerRadius={1}
            />
          </>
        );

      case 'fixed':
      default:
        // Simple circle for fixed panels
        return (
          <Circle
            x={absX}
            y={absY}
            radius={size/2}
            fill="gray"
            stroke="black"
            strokeWidth={strokeWidth}
          />
        );
    }
  };

  return (
    <React.Fragment>
      {renderHandleIcon()}
      {/* Invisible larger circle for easier dragging */}
      <Circle
        x={absX}
        y={absY}
        radius={20}
        fill="transparent"
        draggable
        onDragEnd={handleDragEnd}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'move';
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'default';
        }}
      />
    </React.Fragment>
  );
};