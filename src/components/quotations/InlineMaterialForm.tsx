import { useId } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DescribedSelect } from '@/components/ui/described-select';
import { useInlineMaterial } from '@/hooks/useInlineMaterial';
import type { CostingLine } from '@/services/costingTypes';
import type { MaterialCostEditing } from './materialCostEditing';

interface InlineMaterialFormProps {
  editing: MaterialCostEditing; itemId?: string; currency: string; existing?: CostingLine; onSave: (line: CostingLine) => void; onCancel: () => void;
}
export const InlineMaterialForm: React.FC<InlineMaterialFormProps> = ({ editing, itemId, currency, existing, onSave, onCancel }) => {
  const id = useId();
  const form = useInlineMaterial(editing.materials, currency, itemId, existing);
  return <div className="my-2 space-y-2 rounded border bg-background p-2" aria-label={existing ? `Edit ${existing.name}` : 'Add product material'}>
    {editing.error && <p role="alert" className="text-xs text-destructive">{editing.error} <Button type="button" variant="link" size="xs" onClick={editing.retry}>Retry</Button></p>}
    <div className="space-y-1"><Label htmlFor={`${id}-material`} className="text-xs">Material</Label>
      <DescribedSelect id={`${id}-material`} label="Catalogue material" value={form.selected} options={form.options} onChange={form.select} placeholder="Choose a material…" /></div>
    <div className="grid grid-cols-2 items-end gap-2 xl:grid-cols-[1fr_1fr_1fr_auto]">
      <div className="space-y-1"><Label htmlFor={`${id}-qty`} className="text-xs">Total qty {form.unit && `(${form.unit})`}</Label><Input id={`${id}-qty`} type="number" min="0.001" max="1000000" step="any" value={form.quantity} onChange={event => form.setQuantity(event.target.value)} /></div>
      <div className="space-y-1"><Label htmlFor={`${id}-cost`} className="text-xs">Unit cost ({currency})</Label><Input id={`${id}-cost`} type="number" min="0" max="1000000" step="any" value={form.unitCost} onChange={event => form.setUnitCost(event.target.value)} /></div>
      <div className="space-y-1"><Label htmlFor={`${id}-waste`} className="text-xs">Wastage (%)</Label><Input id={`${id}-waste`} type="number" min="0" max="1000" step="any" value={form.wastage} onChange={event => form.setWastage(event.target.value)} /></div>
      <div className="flex gap-1"><Button type="button" size="icon-sm" aria-label={existing ? 'Save material changes' : 'Confirm material'} disabled={!form.canSave || editing.busy} onClick={() => { const line = form.build(); if (line) onSave(line); }}><Check /></Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Cancel material" onClick={onCancel}><X /></Button></div>
    </div>
    <p className="text-[11px] leading-4 text-muted-foreground">{itemId ? 'Total quantity for this product’s full quoted quantity.' : 'Total quantity for the whole quotation.'} Save changes with the quotation.</p>
  </div>;
};
