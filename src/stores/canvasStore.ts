import { create } from 'zustand';

// Utility function to generate thumbnail
const generateThumbnail = async (_shapes: Shape[]): Promise<string> => {
  // For now, return a placeholder. In a real implementation, this would:
  // 1. Create a small offscreen canvas
  // 2. Draw the shapes on it
  // 3. Convert to base64
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
};

interface Shape {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  panelType?: string;
  isOpening?: boolean;
  openingDirection?: string;
  openingType?: 'Fixed' | 'Casement In' | 'Casement Out' | 'Tilt & Turn' | 'Sliding';
  measurements?: any;
  angle?: number; // For arc panels
  points?: number[]; // For polygons
  handles?: Handle[]; // Handles for the panel
}

interface Handle {
  id: string;
  type: 'casement' | 'sliding' | 'tilt-turn' | 'fixed';
  position: { x: number; y: number }; // Relative position (0-1) within panel
  side: 'left' | 'right' | 'top' | 'bottom';
}

interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string; // Base64 encoded image
  shapes: Shape[];
  createdAt: Date;
  updatedAt: Date;
}

interface CanvasState {
  tool: string;
  shapes: Shape[];
  selectedId: string | null;
  currentPolygon: { points: number[]; isDrawing: boolean };
  canvasZoom: number;
  canvasPosition: { x: number; y: number };
  templates: Template[];
  scale: number; // pixels to mm conversion
  setTool: (tool: string) => void;
  addShape: (shape: Shape) => void;
  addRectanglePanel: () => void;
  addArcPanel: () => void;
  selectShape: (id: string | null) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  addPolygonPoint: (x: number, y: number) => void;
  completePolygon: () => void;
  updatePolygonPoint: (shapeId: string, pointIndex: number, x: number, y: number) => void;
  setCanvasZoom: (zoom: number) => void;
  setCanvasPosition: (pos: { x: number; y: number }) => void;
  addHandle: (shapeId: string, handle: Handle) => void;
  updateHandle: (shapeId: string, handleId: string, position: { x: number; y: number }) => void;
  removeHandle: (shapeId: string, handleId: string) => void;
  updateHandlesForOpeningType: (shapeId: string, openingType: string) => void;
  saveTemplate: (name: string, description: string) => Promise<void>;
  loadTemplate: (templateId: string) => void;
  deleteTemplate: (templateId: string) => void;
  updateTemplate: (templateId: string, name: string, description: string) => void;
  setScale: (scale: number) => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  tool: 'select',
  shapes: [],
  selectedId: null,
  currentPolygon: { points: [], isDrawing: false },
  canvasZoom: 1,
  canvasPosition: { x: 0, y: 0 },
  templates: [],
  scale: 1, // 1 pixel = 1 mm by default
  setTool: (tool) => set({ tool, currentPolygon: tool === 'polygon' ? { points: [], isDrawing: true } : { points: [], isDrawing: false } }),
  addShape: (shape) => set((state) => ({ shapes: [...state.shapes, shape] })),
  addRectanglePanel: () => {
    const newPanel: Shape = {
      id: `panel-${Date.now()}`,
      type: 'rectanglePanel',
      x: 100,
      y: 100,
      width: 200,
      height: 100,
      panelType: 'standard',
      isOpening: false,
      openingDirection: 'none',
      openingType: 'Fixed',
      measurements: { width: 200, height: 100 },
    };
    get().addShape(newPanel);
  },
  addArcPanel: () => {
    const newPanel: Shape = {
      id: `arc-${Date.now()}`,
      type: 'arcPanel',
      x: 150,
      y: 150,
      width: 200,
      height: 150,
      panelType: 'arch',
      isOpening: false,
      openingDirection: 'none',
      openingType: 'Fixed',
      measurements: { width: 200, height: 150 },
      angle: 180, // semicircle
    };
    get().addShape(newPanel);
  },
  selectShape: (id: string | null) => set({ selectedId: id }),
  updateShape: (id: string, updates: Partial<Shape>) => set((state) => {
    const updatedShapes = state.shapes.map(shape =>
      shape.id === id ? { ...shape, ...updates } : shape
    );

    // If openingType was updated, update handles accordingly
    if (updates.openingType) {
      const shape = updatedShapes.find(s => s.id === id);
      if (shape) {
        get().updateHandlesForOpeningType(id, updates.openingType);
      }
    }

    return { shapes: updatedShapes };
  }),
  addPolygonPoint: (x: number, y: number) => set((state) => ({
    currentPolygon: {
      ...state.currentPolygon,
      points: [...state.currentPolygon.points, x, y],
    },
  })),
  completePolygon: () => set((state) => {
    if (state.currentPolygon.points.length >= 6) { // at least 3 points
      const newShape: Shape = {
        id: `polygon-${Date.now()}`,
        type: 'polygon',
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        points: [...state.currentPolygon.points],
      };
      return {
        shapes: [...state.shapes, newShape],
        currentPolygon: { points: [], isDrawing: false },
        tool: 'select',
      };
    }
    return state;
  }),
  updatePolygonPoint: (shapeId: string, pointIndex: number, x: number, y: number) => set((state) => ({
    shapes: state.shapes.map(shape => {
      if (shape.id === shapeId && shape.points) {
        const newPoints = [...shape.points];
        newPoints[pointIndex * 2] = x;
        newPoints[pointIndex * 2 + 1] = y;
        return { ...shape, points: newPoints };
      }
      return shape;
    }),
  })),
  setCanvasZoom: (zoom: number) => set({ canvasZoom: zoom }),
  setCanvasPosition: (pos: { x: number; y: number }) => set({ canvasPosition: pos }),
  addTemplate: (template: any) => set((state) => ({ templates: [...state.templates, template] })),
  addHandle: (shapeId: string, handle: Handle) => set((state) => ({
    shapes: state.shapes.map(shape =>
      shape.id === shapeId
        ? { ...shape, handles: [...(shape.handles || []), handle] }
        : shape
    ),
  })),
  updateHandle: (shapeId: string, handleId: string, position: { x: number; y: number }) => set((state) => ({
    shapes: state.shapes.map(shape =>
      shape.id === shapeId && shape.handles
        ? {
            ...shape,
            handles: shape.handles.map(handle =>
              handle.id === handleId ? { ...handle, position } : handle
            )
          }
        : shape
    ),
  })),
  removeHandle: (shapeId: string, handleId: string) => set((state) => ({
    shapes: state.shapes.map(shape =>
      shape.id === shapeId && shape.handles
        ? { ...shape, handles: shape.handles.filter(handle => handle.id !== handleId) }
        : shape
    ),
  })),
  updateHandlesForOpeningType: (shapeId: string, openingType: string) => set((state) => ({
    shapes: state.shapes.map(shape => {
      if (shape.id === shapeId) {
        let handles: Handle[] = [];

        switch (openingType) {
          case 'Casement In':
          case 'Casement Out':
            // Add casement handles on left and right sides
            handles = [
              {
                id: `handle-${shapeId}-left`,
                type: 'casement',
                position: { x: 0, y: 0.5 },
                side: 'left',
              },
              {
                id: `handle-${shapeId}-right`,
                type: 'casement',
                position: { x: 1, y: 0.5 },
                side: 'right',
              },
            ];
            break;
          case 'Sliding':
            // Add sliding handles on top and bottom
            handles = [
              {
                id: `handle-${shapeId}-top`,
                type: 'sliding',
                position: { x: 0.5, y: 0 },
                side: 'top',
              },
              {
                id: `handle-${shapeId}-bottom`,
                type: 'sliding',
                position: { x: 0.5, y: 1 },
                side: 'bottom',
              },
            ];
            break;
          case 'Tilt & Turn':
            // Add tilt-turn handle in center
            handles = [
              {
                id: `handle-${shapeId}-center`,
                type: 'tilt-turn',
                position: { x: 0.5, y: 0.5 },
                side: 'left', // Default side
              },
            ];
            break;
          case 'Fixed':
          default:
            // No handles for fixed panels
            handles = [];
            break;
        }

        return { ...shape, handles };
      }
      return shape;
    }),
  })),
  saveTemplate: async (name: string, description: string) => {
    const state = get();
    // Generate thumbnail by capturing canvas
    const thumbnail = await generateThumbnail(state.shapes);

    const template: Template = {
      id: `template-${Date.now()}`,
      name,
      description,
      thumbnail,
      shapes: JSON.parse(JSON.stringify(state.shapes)), // Deep copy
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({ templates: [...state.templates, template] }));
  },
  loadTemplate: (templateId: string) => set((state) => {
    const template = state.templates.find(t => t.id === templateId);
    if (template) {
      return {
        shapes: JSON.parse(JSON.stringify(template.shapes)), // Deep copy
        selectedId: null,
        tool: 'select',
      };
    }
    return state;
  }),
  deleteTemplate: (templateId: string) => set((state) => ({
    templates: state.templates.filter(t => t.id !== templateId),
  })),
  updateTemplate: (templateId: string, name: string, description: string) => set((state) => ({
    templates: state.templates.map(t =>
      t.id === templateId
        ? { ...t, name, description, updatedAt: new Date() }
        : t
    ),
  })),
  setScale: (scale: number) => set({ scale }),
}));