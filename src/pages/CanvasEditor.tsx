import React from 'react';
import Toolbar from '@/components/Toolbar';
import Canvas from '@/components/Canvas';
import PropertiesPanel from '@/components/PropertiesPanel';
import { TemplatesSidebar } from '@/components/TemplatesSidebar';

const CanvasEditor: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <TemplatesSidebar />
      <div className="flex flex-col flex-1">
        <Toolbar />
        <div className="flex flex-1">
          <Canvas />
          <PropertiesPanel />
        </div>
      </div>
    </div>
  );
};

export default CanvasEditor;