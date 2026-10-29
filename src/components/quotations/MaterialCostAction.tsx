import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import type { CostingLine, ItemMaterialApproval } from '@/services/costingTypes';
import type { QuotationItem } from '@/services/quotationService';
import { MaterialCostDialog } from './MaterialCostDialog';
import '@/styles/MaterialCostReport.css';

interface MaterialCostActionProps { items: QuotationItem[]; quotationId?: string; clientName?: string; manualMaterials?: CostingLine[]; onManualMaterialsChange?: (lines: CostingLine[]) => void; itemApprovals?: ItemMaterialApproval[]; onItemApprovalsChange?: (approvals: ItemMaterialApproval[]) => void }
export const MaterialCostAction: React.FC<MaterialCostActionProps> = props => {
  const [open, setOpen] = useState(false);
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
      <Calculator className="h-4 w-4" />Material costs
    </DialogTrigger>
    <DialogContent className="flex max-h-[90dvh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:w-[80vw] sm:max-w-none">
      {open && <MaterialCostDialog {...props} />}
    </DialogContent>
  </Dialog>;
};
