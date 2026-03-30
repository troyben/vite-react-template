import { useRef, useEffect } from 'react';
import { Rect, Wedge, Transformer } from 'react-konva';
import { useCanvasStore } from '@/stores/canvasStore';
import { MeasurementLabel } from './MeasurementLabel';
import { SwingIndicator } from './SwingIndicator';
import { Handle } from './Handle';
import { OpeningIndicator } from './OpeningIndicator';

interface ArcPanelProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  panelType?: string;
  isOpening?: boolean;
  openingDirection?: string;
  measurements?: any;
  angle?: number;
  openingType?: 'Fixed' | 'Casement In' | 'Casement Out' | 'Tilt & Turn' | 'Sliding';
  handles?: any[];
}

export const ArcPanel: React.FC<ArcPanelProps> = ({
  id, x, y, width, height, measurements, angle = 180, openingType, handles
}) => {
    const { selectedId, selectShape, updateShape, scale } = useCanvasStore();
    const shapeRef = useRef<any>(null);
    const trRef = useRef<any>(null);

    useEffect(() => {
      if (selectedId === id && trRef.current && shapeRef.current) {
        trRef.current.nodes([shapeRef.current]);
        trRef.current.getLayer().batchDraw();
      }
    }, [selectedId, id]);

    const handleSelect = () => {
      selectShape(id);
    };

    const handleDragEnd = (e: any) => {
      updateShape(id, { x: e.target.x(), y: e.target.y() });
    };

    const handleTransformEnd = () => {
      const node = shapeRef.current;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      node.scaleX(1);
      node.scaleY(1);

      updateShape(id, {
        x: node.x(),
        y: node.y(),
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(5, node.height() * scaleY),
        measurements: {
          ...measurements,
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY),
        },
      });
    };

    const getStrokeStyle = () => {
    switch (openingType) {
      case 'Fixed':
        return { stroke: 'black', strokeWidth: 2, dash: undefined };
      case 'Casement In':
        return { stroke: 'blue', strokeWidth: 3, dash: undefined };
      case 'Casement Out':
        return { stroke: 'green', strokeWidth: 3, dash: undefined };
      case 'Tilt & Turn':
        return { stroke: 'orange', strokeWidth: 3, dash: [5, 5] };
      case 'Sliding':
        return { stroke: 'purple', strokeWidth: 3, dash: [10, 5] };
      default:
        return { stroke: 'black', strokeWidth: 2, dash: undefined };
    }
  };

  const strokeStyle = getStrokeStyle();

    const rectHeight = height * 0.7; // Rectangle takes 70% height
    const arcHeight = height * 0.3; // Arc takes 30% height
    const radius = width / 2;
    const arcY = y + arcHeight / 2;

    return (
      <>
        <Rect
          ref={shapeRef}
          x={x}
          y={y + arcHeight}
          width={width}
          height={rectHeight}
          stroke={strokeStyle.stroke}
          strokeWidth={strokeStyle.strokeWidth}
          dash={strokeStyle.dash}
          fill="transparent"
          draggable
          onClick={handleSelect}
          onTap={handleSelect}
          onDragEnd={handleDragEnd}
          onTransformEnd={handleTransformEnd}
        />
        <Wedge
          x={x + width / 2}
          y={arcY}
          radius={radius}
          angle={angle}
          rotation={-angle / 2}
          stroke={strokeStyle.stroke}
          strokeWidth={strokeStyle.strokeWidth}
          dash={strokeStyle.dash}
          fill="transparent"
          draggable={false} // Only the rect is draggable
        />
        {selectedId === id && (
          <Transformer
            ref={trRef}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
          />
        )}
        {selectedId === id && (
          <MeasurementLabel x={x} y={y} width={width} height={height} scale={scale} />
        )}
        {(openingType === 'Casement In' || openingType === 'Casement Out') && (
          <SwingIndicator x={x} y={y} width={width} height={height} openingType={openingType} />
        )}
        <OpeningIndicator x={x} y={y} width={width} height={height} openingType={openingType || 'Fixed'} />
        {handles && handles.map((handle: any) => (
          <Handle
            key={handle.id}
            shapeId={id}
            handle={handle}
            panelX={x}
            panelY={y}
            panelWidth={width}
            panelHeight={height}
          />
        ))}
      </>
    );
  };

export default ArcPanel;