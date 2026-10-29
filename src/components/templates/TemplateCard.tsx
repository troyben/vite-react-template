import { Loader2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import ShapeCanvas from '@/components/product-editor/canvas/ShapeCanvas';
import type { SketchTemplate } from '@/services/templateService';
import { extractShapeCanvasProps, formatTemplateDate } from '@/utils/templateSketchProps';

interface TemplateCardProps {
  template: SketchTemplate;
  canDelete: boolean;
  deleting: boolean;
  onOpen: () => void;
  onDelete: (event: React.MouseEvent) => void;
}

export default function TemplateCard({ template, canDelete, deleting, onOpen, onDelete }: TemplateCardProps) {
  return (
    <Card className="relative min-w-0 gap-0 py-0 transition-shadow hover:shadow-md">
      <button
        type="button"
        aria-label={`Preview ${template.name}`}
        onClick={onOpen}
        className="w-full min-w-0 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <div className="flex h-44 items-center justify-center border-b bg-muted/20 p-3 sm:h-48">
          <ShapeCanvas
            {...extractShapeCanvasProps(template.sketchData)}
            svgStyle={{ width: '100%', height: '100%' }}
          />
        </div>
        <div className="space-y-1 p-3 pr-12">
          <div className="flex items-center gap-2">
            <h2 className="min-w-0 truncate text-sm font-semibold" title={template.name}>{template.name}</h2>
            {template.isMaster && <Badge variant="secondary" className="shrink-0 text-[10px]">Master</Badge>}
          </div>
          <p className="truncate text-xs text-muted-foreground">{template.creator ? `by ${template.creator.name}` : 'Creator unavailable'}</p>
          <p className="text-xs text-muted-foreground">{formatTemplateDate(template.createdAt)}</p>
        </div>
      </button>
      {canDelete && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Delete ${template.name}`}
          onClick={onDelete}
          className="absolute right-2 bottom-3 text-muted-foreground hover:text-destructive"
          disabled={deleting}
        >
          {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
        </Button>
      )}
    </Card>
  );
}
