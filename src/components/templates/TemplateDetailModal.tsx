import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil } from 'lucide-react';
import ShapeCanvas from '@/components/product-editor/canvas/ShapeCanvas';
import { MaterialBreakdownView } from '@/components/CostBreakdown';
import { previewProductMaterials } from '@/services/costingService';
import { extractShapeCanvasProps, formatTemplateDate } from '@/utils/templateSketchProps';
import type { CostBreakdown } from '@/utils/costCalculator';
import type { SketchTemplate } from '@/services/templateService';

interface TemplateDetailModalProps {
  template: SketchTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TemplateDetailModal({
  template,
  open,
  onOpenChange,
}: TemplateDetailModalProps) {
  const navigate = useNavigate();
  const [costLoading, setCostLoading] = useState(false);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null);
  const [costError, setCostError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !template) {
      setCostBreakdown(null);
      setCostError(null);
      return;
    }

    let cancelled = false;

    const fetchCost = async () => {
      setCostLoading(true);
      setCostBreakdown(null);
      setCostError(null);
      try {
        const result = await previewProductMaterials(template.sketchData);
        if (cancelled) return;
        setCostBreakdown(result.breakdown);
        if (result.warnings.length) setCostError(result.warnings.join(' '));
      } catch {
        if (!cancelled) {
          setCostError('Failed to fetch materials. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setCostLoading(false);
        }
      }
    };

    fetchCost();
    return () => {
      cancelled = true;
    };
  }, [open, template]);

  if (!template) return null;

  const canvasProps = extractShapeCanvasProps(template.sketchData);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[95dvh] w-[95vw] max-w-none flex-col gap-0 overflow-hidden p-0 sm:w-[85vw] sm:max-w-none">
        <DialogHeader className="shrink-0 border-b px-5 py-4 pr-12">
          <div className="flex items-center gap-2">
            <DialogTitle className="min-w-0 break-words leading-snug">{template.name}</DialogTitle>
            {template.isMaster && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Master
              </Badge>
            )}
          </div>
          <DialogDescription>
            {template.creator && <>by {template.creator.name} &middot; </>}
            {formatTemplateDate(template.createdAt)}
            {template.description && (
              <span className="block mt-1">{template.description}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <div className="flex h-64 min-w-0 items-center justify-center rounded-lg border bg-muted/20 p-3 sm:h-80 lg:h-[400px]">
              <ShapeCanvas
                {...canvasProps}
                svgStyle={{ width: '100%', height: '100%' }}
              />
            </div>

            <section aria-labelledby="template-materials-heading" className="min-w-0 space-y-3">
              <h2 id="template-materials-heading" className="font-medium">Materials</h2>
              {costLoading && (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              )}
              {costError && !costLoading && (
                <div className="rounded-md bg-muted/50 p-4 text-center text-sm text-muted-foreground">
                  {costError}
                </div>
              )}
              {costBreakdown && !costLoading && (
                <MaterialBreakdownView breakdown={costBreakdown} className="sm:grid-cols-1" />
              )}
            </section>
          </div>
        </div>

        <DialogFooter className="m-0 shrink-0 flex-row justify-end px-5 py-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              navigate(`/templates/${template.id}/edit`);
            }}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
