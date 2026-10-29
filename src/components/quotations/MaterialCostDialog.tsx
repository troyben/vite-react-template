import { createPortal } from 'react-dom';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { CostingLine } from '@/services/costingTypes';
import type { QuotationItem } from '@/services/quotationService';
import { useMaterialCostReport } from '@/hooks/useMaterialCostReport';
import { materialCostReportTitle, printMaterialCostReport } from '@/services/materialCostReportService';
import { ManualMaterialEditor } from './ManualMaterialEditor';
import { MaterialCostTotal } from './MaterialCostTotal';
import { MaterialCostReport } from './MaterialCostReport';

interface MaterialCostDialogProps { items: QuotationItem[]; quotationId?: string; clientName?: string; manualMaterials?: CostingLine[]; onManualMaterialsChange?: (lines: CostingLine[]) => void }
export const MaterialCostDialog: React.FC<MaterialCostDialogProps> = ({ items, quotationId, clientName, manualMaterials, onManualMaterialsChange }) => {
  const { report, loading, error, currency } = useMaterialCostReport(items, quotationId, manualMaterials);
  const title = materialCostReportTitle(quotationId, clientName);
  return <>
    <DialogHeader className="shrink-0 border-b px-6 py-3 pr-12">
      <DialogTitle>Material costs</DialogTitle>
      <DialogDescription className="text-xs">{title} · Internal material estimate</DialogDescription>
    </DialogHeader>
    <div className="min-h-0 flex-1 overflow-y-auto space-y-3 p-3 sm:p-4" aria-busy={loading} aria-live="polite">
      {manualMaterials && onManualMaterialsChange && <ManualMaterialEditor lines={manualMaterials} items={items} currency={currency} onChange={onManualMaterialsChange} />}
      {loading && <p role="status" className="text-muted-foreground">Calculating material costs…</p>}
      {error && <p role="alert" className="text-destructive">{error} Close and reopen this modal to retry.</p>}
      {report && <MaterialCostReport report={report} title={title} items={items} showTotal={false} />}
    </div>
    {report && <div className="shrink-0 bg-background px-3 sm:px-4" aria-live="polite"><MaterialCostTotal report={report} /></div>}
    <DialogFooter className="m-0 shrink-0 px-6">
      <DialogClose render={<Button type="button" variant="outline" />}>Close</DialogClose>
      <Button type="button" onClick={printMaterialCostReport} disabled={!report || loading || !!error}>
        <Printer className="h-4 w-4" />Print
      </Button>
    </DialogFooter>
    {report && !loading && !error && createPortal(<div data-material-cost-print-root>
      <MaterialCostReport report={report} title={title} items={items} />
    </div>, document.body)}
  </>;
};
