import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { CostBreakdown as CostBreakdownType, CostLineItem } from '@/utils/costCalculator';
import { formatCurrency } from '@/config/currency';

interface CostBreakdownProps {
  breakdown: CostBreakdownType;
}

const SECTION_CONFIG = [
  { key: 'frameItems' as const, title: 'Frame Profiles', color: 'bg-blue-100 text-blue-800' },
  { key: 'glassItems' as const, title: 'Glass', color: 'bg-emerald-100 text-emerald-800' },
  { key: 'hardwareItems' as const, title: 'Hardware', color: 'bg-amber-100 text-amber-800' },
  { key: 'accessoryItems' as const, title: 'Accessories', color: 'bg-violet-100 text-violet-800' },
];

function formatQuantity(qty: number, unit: string): string {
  return `${qty} ${unit}`;
}

function CostSection({
  title,
  items,
  color,
}: {
  title: string;
  items: CostLineItem[];
  color: string;
}) {
  if (items.length === 0) return null;

  const sectionTotal = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className={color}>
          {title}
        </Badge>
        <span className="text-sm font-medium">{formatCurrency(sectionTotal)}</span>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-8 text-xs">Material</TableHead>
            <TableHead className="h-8 text-xs text-right">Qty</TableHead>
            <TableHead className="h-8 text-xs text-right">Unit Cost</TableHead>
            <TableHead className="h-8 text-xs text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, idx) => (
            <TableRow key={idx} className="hover:bg-muted/50">
              <TableCell className="py-1.5 text-sm">{item.material}</TableCell>
              <TableCell className="py-1.5 text-sm text-right">
                {formatQuantity(item.quantity, item.unit)}
              </TableCell>
              <TableCell className="py-1.5 text-sm text-right">
                {formatCurrency(item.unitCost)}
              </TableCell>
              <TableCell className="py-1.5 text-sm text-right font-medium">
                {formatCurrency(item.total)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function CostBreakdownView({ breakdown }: CostBreakdownProps) {
  const hasItems =
    breakdown.frameItems.length > 0 ||
    breakdown.glassItems.length > 0 ||
    breakdown.hardwareItems.length > 0 ||
    breakdown.accessoryItems.length > 0;

  if (!hasItems) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No matching materials found for this product configuration.
          Add materials in the Materials management page.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Cost Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(() => {
          let renderedCount = 0;
          return SECTION_CONFIG.map((section) => {
            const items = breakdown[section.key];
            if (items.length === 0) return null;
            const showSeparator = renderedCount > 0;
            renderedCount++;
            return (
              <div key={section.key}>
                {showSeparator && <Separator className="mb-4" />}
                <CostSection
                  title={section.title}
                  items={items}
                  color={section.color}
                />
              </div>
            );
          });
        })()}

        <Separator />

        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-semibold">Total Cost</span>
          <span className="text-lg font-bold">{formatCurrency(breakdown.totalCost)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
