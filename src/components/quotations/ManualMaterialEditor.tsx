import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DescribedSelect } from '@/components/ui/described-select';
import { useManualMaterialEditor } from '@/hooks/useManualMaterialEditor';
import { COSTING_UNITS, type CostingLine } from '@/services/costingTypes';
import type { QuotationItem } from '@/services/quotationService';
import { MaterialAssignment } from './MaterialAssignment';
import { ManualMaterialLines } from './ManualMaterialLines';

interface ManualMaterialEditorProps { lines: CostingLine[]; items: QuotationItem[]; currency?: string; onChange: (lines: CostingLine[]) => void }
export const ManualMaterialEditor: React.FC<ManualMaterialEditorProps> = ({ lines, items, currency, onChange }) => {
  const editor = useManualMaterialEditor(lines, onChange, currency);
  return <section className="space-y-2 rounded-lg border p-3" aria-label="Manual materials">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-sm font-semibold">Manual materials</h2>
      <p className="text-xs text-muted-foreground">Add catalogue materials without changing their defaults. Changes are saved with the quotation.</p></div>
      <Button type="button" variant="outline" size="sm" aria-expanded={editor.expanded} onClick={() => editor.setExpanded(!editor.expanded)}><Plus />Add material</Button></div>
    {editor.error && <p role="alert" className="text-sm text-destructive">{editor.error} <Button type="button" variant="link" size="xs" onClick={editor.retry}>Retry</Button></p>}
    {editor.expanded && <div className="space-y-2 border-t pt-3">
      <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(14rem,2fr)_minmax(10rem,1fr)_7rem_7rem_auto]">
        <div className="space-y-1"><Label htmlFor="manual-material">Material</Label><DescribedSelect id="manual-material" label="Catalogue material" options={editor.options} value={editor.selected}
          placeholder="Choose a material…" disabled={!currency} onChange={editor.setSelected} /></div>
        <div className="space-y-1"><Label>Applies to</Label><MaterialAssignment value={editor.assignment} items={items} label="New material assignment" onChange={editor.setAssignment} /></div>
        <div className="space-y-1"><Label htmlFor="manual-quantity">Total qty {editor.material ? `(${COSTING_UNITS[editor.material.unit]})` : ''}</Label>
          <Input id="manual-quantity" type="number" min="0.001" max="1000000" step="any" value={editor.quantity} onChange={event => editor.setQuantity(event.target.value)} /></div>
        <div className="space-y-1"><Label htmlFor="manual-wastage">Wastage (%)</Label><Input id="manual-wastage" type="number" min="0" max="1000" step="any" value={editor.wastage} onChange={event => editor.setWastage(event.target.value)} /></div>
        <Button type="button" size="sm" disabled={!editor.canAdd} onClick={editor.add}>Add to costs</Button>
      </div>
      <p className="text-xs text-muted-foreground">Enter the total quantity for all units of the selected item, or for the whole quotation. Manual quantities stay fixed when dimensions or quoted quantities change; review them after edits.</p>
      {currency && editor.options.length === 0 && !editor.error && <p className="text-xs text-muted-foreground">No materials available in {currency}. Add one in Materials, then reopen this modal.</p>}
    </div>}
    {lines.length > 0 && <ManualMaterialLines lines={lines} items={items} currency={currency || 'USD'} onUpdate={editor.update} onRemove={editor.remove} />}
  </section>;
};
