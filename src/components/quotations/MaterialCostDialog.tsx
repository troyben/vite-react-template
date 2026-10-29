import { createPortal } from 'react-dom';
import { CheckCheck, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { CostingLine, ItemMaterialApproval } from '@/services/costingTypes';
import type { QuotationItem } from '@/services/quotationService';
import { useMaterialCostReport } from '@/hooks/useMaterialCostReport';
import { allMaterialApprovals, materialCostReportTitle, printMaterialCostReport } from '@/services/materialCostReportService';
import { useCostingCatalogue } from '@/hooks/useCostingCatalogue';
import { MaterialCostTotal } from './MaterialCostTotal';
import { MaterialCostReport } from './MaterialCostReport';

interface MaterialCostDialogProps { items: QuotationItem[]; quotationId?: string; clientName?: string; savedOnly?: boolean; manualMaterials?: CostingLine[]; onManualMaterialsChange?: (lines: CostingLine[]) => void; itemApprovals?: ItemMaterialApproval[]; onItemApprovalsChange?: (approvals: ItemMaterialApproval[]) => void }
export const MaterialCostDialog: React.FC<MaterialCostDialogProps> = ({ items, quotationId, clientName, manualMaterials, onManualMaterialsChange, itemApprovals, onItemApprovalsChange, savedOnly }) => {
  const { report, displayReport, loading, error } = useMaterialCostReport(items, quotationId, manualMaterials, itemApprovals, savedOnly);
  const catalogue = useCostingCatalogue(!!onManualMaterialsChange);
  const editing = manualMaterials && onManualMaterialsChange && onItemApprovalsChange ? {
    lines: manualMaterials, materials: catalogue.materials, approvals: itemApprovals ?? [], busy: loading,
    error: catalogue.error, retry: catalogue.retry, onChange: onManualMaterialsChange, onApprove: onItemApprovalsChange,
  } : undefined;
  const bulkApproval = allMaterialApprovals(items, report, itemApprovals);
  const title = materialCostReportTitle(quotationId, clientName);
  return <>
    <DialogHeader className="shrink-0 border-b px-6 py-3 pr-12">
      <DialogTitle>Material costs</DialogTitle>
      <DialogDescription className="text-xs">{title} · Internal material estimate</DialogDescription>
    </DialogHeader>
    <div className="min-h-0 flex-1 overflow-y-auto space-y-3 p-3 sm:p-4" aria-busy={loading} aria-live="polite">
      {loading && <p role="status" className="text-muted-foreground">Calculating material costs…</p>}
      {error && <p role="alert" className="text-destructive">{error} Close and reopen this modal to retry.</p>}
      {displayReport && <MaterialCostReport report={displayReport} title={title} items={items} showTotal={false} editing={editing} />}
    </div>
    {displayReport && <div className="shrink-0 bg-background px-3 sm:px-4" aria-live="polite"><MaterialCostTotal report={displayReport} /></div>}
    <DialogFooter className="m-0 shrink-0 px-6">
      <DialogClose render={<Button type="button" variant="outline" />}>Close</DialogClose>
      {editing && <Button type="button" variant="outline" disabled={!bulkApproval.count || loading || !!error}
        onClick={() => onItemApprovalsChange?.(bulkApproval.approvals)}><CheckCheck className="h-4 w-4" />Approve all</Button>}
      <Button type="button" onClick={printMaterialCostReport} disabled={!report || loading || !!error}>
        <Printer className="h-4 w-4" />Print
      </Button>
    </DialogFooter>
    {report && !loading && !error && createPortal(<div data-material-cost-print-root>
      <MaterialCostReport report={report} title={title} items={items} />
    </div>, document.body)}
  </>;
};
