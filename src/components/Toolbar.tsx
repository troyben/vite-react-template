import React from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { Button } from '@/components/ui/button';
import { MousePointer, Square, Circle, RectangleHorizontal, Triangle, Plus, Check } from 'lucide-react';

const Toolbar: React.FC = () => {
  const { tool, setTool, addRectanglePanel, addArcPanel, completePolygon } = useCanvasStore();

  return (
    <div className="flex space-x-2 p-2 bg-gray-100 border-b">
      <Button
        onClick={() => setTool('select')}
        variant={tool === 'select' ? 'default' : 'ghost'}
        size="icon"
        title="Select Tool"
      >
        <MousePointer size={20} />
      </Button>
      <Button
        onClick={() => setTool('rect')}
        variant={tool === 'rect' ? 'default' : 'ghost'}
        size="icon"
        title="Rectangle Tool - Click on canvas to add panel"
      >
        <Square size={20} />
      </Button>
      <Button
        onClick={() => setTool('pen')}
        variant={tool === 'pen' ? 'default' : 'ghost'}
        size="icon"
        title="Arc Tool - Click on canvas to add arched panel"
      >
        <Circle size={20} />
      </Button>
      <Button
        onClick={() => addRectanglePanel()}
        variant="ghost"
        size="icon"
        title="Add Rectangle Panel"
      >
        <Plus size={16} />
        <RectangleHorizontal size={16} />
      </Button>
      <Button
        onClick={() => addArcPanel()}
        variant="ghost"
        size="icon"
        title="Add Arc Panel"
      >
        <Plus size={16} />
        <Circle size={16} />
      </Button>
      <Button
        onClick={() => setTool('polygon')}
        variant={tool === 'polygon' ? 'default' : 'ghost'}
        size="icon"
        title="Polygon Tool"
      >
        <Triangle size={20} />
      </Button>
      <Button
        onClick={() => completePolygon()}
        variant="ghost"
        size="icon"
        disabled={tool !== 'polygon'}
        title="Complete Polygon"
      >
        <Check size={20} />
      </Button>
    </div>
  );
};

export default Toolbar;
