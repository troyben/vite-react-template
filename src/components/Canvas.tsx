import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import { useCanvasStore } from '@/stores/canvasStore';
import { RectanglePanel } from './RectanglePanel';
import { ArcPanel } from './ArcPanel';
import { PolygonShape } from './PolygonShape';

const Canvas: React.FC = () => {
  const { shapes, tool, selectShape, currentPolygon, addPolygonPoint, canvasZoom, canvasPosition, setCanvasZoom, setCanvasPosition, addShape } = useCanvasStore();
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = stageRef.current;
    const oldScale = canvasZoom;
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - canvasPosition.x) / oldScale,
      y: (pointer.y - canvasPosition.y) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    setCanvasZoom(newScale);

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    setCanvasPosition(newPos);
  };

  const renderGrid = () => {
    const gridSize = 20;
    const lines = [];
    const width = 2000;
    const height = 2000;

    for (let i = 0; i < width / gridSize; i++) {
      lines.push(
        <Line
          key={`v-${i}`}
          points={[i * gridSize, 0, i * gridSize, height]}
          stroke="#ddd"
          strokeWidth={0.5}
        />
      );
    }
    for (let i = 0; i < height / gridSize; i++) {
      lines.push(
        <Line
          key={`h-${i}`}
          points={[0, i * gridSize, width, i * gridSize]}
          stroke="#ddd"
          strokeWidth={0.5}
        />
      );
    }
    return lines;
  };

  const handleClick = (e: any) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const adjustedX = (pos.x - canvasPosition.x) / canvasZoom;
    const adjustedY = (pos.y - canvasPosition.y) / canvasZoom;

    if (tool === 'polygon' && currentPolygon.isDrawing) {
      addPolygonPoint(adjustedX, adjustedY);
    } else if (tool === 'rect') {
      // Create a rectangle panel at click position
      const newPanel = {
        id: `panel-${Date.now()}`,
        type: 'rectanglePanel',
        x: adjustedX - 100, // Center the panel on click
        y: adjustedY - 50,
        width: 200,
        height: 100,
        panelType: 'standard',
        isOpening: false,
        openingDirection: 'none',
        openingType: 'Fixed' as const,
        measurements: { width: 200, height: 100 },
      };
      addShape(newPanel);
    } else if (tool === 'pen') {
      // For now, create an arc panel (you can change this to whatever 'pen' should do)
      const newPanel = {
        id: `arc-${Date.now()}`,
        type: 'arcPanel',
        x: adjustedX - 100,
        y: adjustedY - 75,
        width: 200,
        height: 150,
        panelType: 'arch',
        isOpening: false,
        openingDirection: 'none',
        openingType: 'Fixed' as const,
        measurements: { width: 200, height: 150 },
        angle: 180,
      };
      addShape(newPanel);
    } else {
      selectShape(null);
    }
  };

  return (
    <div ref={containerRef} className="flex-1 bg-white overflow-hidden">
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        x={canvasPosition.x}
        y={canvasPosition.y}
        scaleX={canvasZoom}
        scaleY={canvasZoom}
        onWheel={handleWheel}
        draggable={tool === 'select'}
        onDragEnd={(e) => setCanvasPosition({ x: e.target.x(), y: e.target.y() })}
        onClick={handleClick}
      >
        <Layer>
          {renderGrid()}
          {shapes.map((shape) => {
            if (shape.type === 'rectanglePanel') {
              return (
                <RectanglePanel
                  key={shape.id}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  panelType={shape.panelType}
                  isOpening={shape.isOpening}
                  openingDirection={shape.openingDirection}
                  measurements={shape.measurements}
                  openingType={shape.openingType}
                  handles={shape.handles}
                />
              );
            } else if (shape.type === 'arcPanel') {
              return (
                <ArcPanel
                  key={shape.id}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  panelType={shape.panelType}
                  isOpening={shape.isOpening}
                  openingDirection={shape.openingDirection}
                  measurements={shape.measurements}
                  angle={shape.angle}
                  openingType={shape.openingType}
                  handles={shape.handles}
                />
              );
            } else if (shape.type === 'polygon') {
              return (
                <PolygonShape
                  key={shape.id}
                  id={shape.id}
                  points={shape.points || []}
                />
              );
            }
            return null;
          })}
          {currentPolygon.isDrawing && (
            <Line
              points={currentPolygon.points}
              stroke="blue"
              strokeWidth={2}
              closed={false}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export default Canvas;