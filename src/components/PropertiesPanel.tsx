import React from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PropertiesPanel: React.FC = () => {
  const { selectedId, shapes, updateShape, scale, setScale } = useCanvasStore();
  const selectedShape = shapes.find(shape => shape.id === selectedId);

  const handleDimensionChange = (dimension: 'width' | 'height', value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && selectedShape) {
      const pixelValue = numValue / scale;
      updateShape(selectedShape.id, {
        [dimension]: pixelValue,
        measurements: {
          ...selectedShape.measurements,
          [dimension]: pixelValue,
        },
      });
    }
  };

  const handleScaleChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setScale(numValue);
    }
  };

  const handleOpeningTypeChange = (value: string) => {
    if (selectedShape) {
      updateShape(selectedShape.id, { openingType: value as any });
    }
  };

  return (
    <div className="w-64 bg-gray-50 p-4 border-l">
      <h3 className="text-lg font-semibold mb-4">Properties</h3>

      {/* Scale Setting */}
      <div className="mb-4">
        <Label htmlFor="scale">Scale (px:mm)</Label>
        <Input
          id="scale"
          type="number"
          value={scale}
          onChange={(e) => handleScaleChange(e.target.value)}
          step={0.1}
          min={0.1}
        />
      </div>

      {selectedShape && (
        <>
          <div className="mb-2">
            <Label htmlFor="width">Width (mm)</Label>
            <Input
              id="width"
              type="number"
              value={Math.round(selectedShape.width * scale)}
              onChange={(e) => handleDimensionChange('width', e.target.value)}
            />
          </div>
          <div className="mb-2">
            <Label htmlFor="height">Height (mm)</Label>
            <Input
              id="height"
              type="number"
              value={Math.round(selectedShape.height * scale)}
              onChange={(e) => handleDimensionChange('height', e.target.value)}
            />
          </div>

          {selectedShape.panelType && (
            <div className="mb-2">
              <Label>Panel Type</Label>
              <span className="text-sm block mt-1">{selectedShape.panelType}</span>
            </div>
          )}

          {selectedShape.openingType && (
            <div className="mb-2">
              <Label>Opening Type</Label>
              <Select
                value={selectedShape.openingType}
                onValueChange={(v) => { if (v !== null) handleOpeningTypeChange(v); }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fixed">Fixed</SelectItem>
                  <SelectItem value="Casement In">Casement In</SelectItem>
                  <SelectItem value="Casement Out">Casement Out</SelectItem>
                  <SelectItem value="Tilt & Turn">Tilt & Turn</SelectItem>
                  <SelectItem value="Sliding">Sliding</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PropertiesPanel;
