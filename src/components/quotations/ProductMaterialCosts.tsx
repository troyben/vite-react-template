import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { materialItemEmptyMessage, type MaterialCostReportItem, type MaterialCostReportLine } from '@/services/materialCostReportService';
import { saveManualLine, removeManualLine, setItemMaterialApproval } from '@/services/manualMaterialService';
import type { CostingLine } from '@/services/costingTypes';
import { MaterialCostTable } from './MaterialCostTable';
import { InlineMaterialForm } from './InlineMaterialForm';
import type { MaterialCostEditing } from './materialCostEditing';

interface ProductMaterialCostsProps { lines: MaterialCostReportLine[]; item?: MaterialCostReportItem; itemId?: string; currency: string; editing?: MaterialCostEditing }
export const ProductMaterialCosts: React.FC<ProductMaterialCostsProps> = ({ lines, item, itemId, currency, editing }) => {
  const [form, setForm] = useState<CostingLine | 'new' | null>(null);
  const save = (line: CostingLine) => {
    if (!editing) return;
    editing.onChange(saveManualLine(editing.lines, line));
    setForm(null);
  };
  return <>
    {item?.status === 'needs_review' && lines.length > 0 && <p className="py-1 text-xs text-amber-800 dark:text-amber-300">Needs review · partial calculation</p>}
    {lines.length > 0 ? <MaterialCostTable lines={lines} currency={currency}
      onEdit={editing ? id => setForm(editing.lines.find(line => line.id === id) ?? null) : undefined}
      onRemove={editing ? id => { editing.onChange(removeManualLine(editing.lines, id)); setForm(null); } : undefined} />
      : item && <p className="py-2 text-xs text-muted-foreground">{materialItemEmptyMessage(item)}</p>}
    {editing && <div className="print:hidden">
      <div className="flex flex-wrap items-center gap-3 py-1">
        <Button type="button" variant="link" size="xs" className="h-6 px-0 text-xs" onClick={() => setForm('new')} disabled={editing.busy}><Plus />Add material</Button>
        {item && itemId && item.status !== 'approved' && item.canApprove && <Button type="button" variant="link" size="xs" className="h-6 px-0 text-xs" disabled={editing.busy || !!form}
          onClick={() => editing.onApprove(setItemMaterialApproval(editing.approvals, itemId, item.approvalKey!))}><Check />Approve materials</Button>}
        {item?.status === 'approved' && <span className="flex items-center gap-1 text-xs text-emerald-700"><Check />Approved
          <Button type="button" variant="link" size="xs" className="h-6 px-0 text-xs" disabled={editing.busy} onClick={() => editing.onApprove(setItemMaterialApproval(editing.approvals, itemId!))}>Undo</Button></span>}
      </div>
      {form && <InlineMaterialForm key={typeof form === 'string' ? 'new' : form.id} editing={editing} itemId={itemId} currency={currency} existing={form === 'new' ? undefined : form} onSave={save} onCancel={() => setForm(null)} />}
    </div>}
  </>;
};
