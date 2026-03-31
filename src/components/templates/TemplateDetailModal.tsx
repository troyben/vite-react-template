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
import { Pencil, Loader2 } from 'lucide-react';
import ShapeCanvas from '@/components/template-creator/ShapeCanvas';
import { MaterialBreakdownView } from '@/components/CostBreakdown';
import { getAllMaterials } from '@/services/materialService';
import { calculateProductCost } from '@/utils/costCalculator';
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
        const response = await getAllMaterials({ limit: 1000 });
        if (cancelled) return;
        if (response.data.success) {
          const materials = response.data.data.items;
          if (materials.length === 0) {
            setCostError('No materials found. Add materials in Materials management to see material breakdown.');
            return;
          }
          const breakdown = calculateProductCost(template.sketchData, materials);
          setCostBreakdown(breakdown);
        } else {
          setCostError('Failed to load materials.');
        }
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
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <DialogTitle>{template.name}</DialogTitle>
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

        <div className="flex-1 overflow-y-auto px-6 pb-2 min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Sketch preview -- takes 3 of 5 columns on desktop */}
            <div className="lg:col-span-3 rounded-lg border bg-muted/20 p-3 flex items-center justify-center min-h-[260px]">
              <ShapeCanvas
                {...canvasProps}
                svgStyle={{ width: '100%', height: '100%', maxHeight: '400px' }}
              />
            </div>

            {/* Material breakdown -- takes 2 of 5 columns on desktop */}
            <div className="lg:col-span-2 min-w-0">
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
                <MaterialBreakdownView breakdown={costBreakdown} />
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-3 border-t shrink-0">
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
