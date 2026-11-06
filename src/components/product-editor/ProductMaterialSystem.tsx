import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MATERIAL_SYSTEMS } from '@/services/materialSystems';
import type { ProductEditorState } from './useProductEditorState';

export function ProductMaterialSystem({ state }: { state: ProductEditorState }) {
  return <div className="flex items-center gap-2">
    <Label htmlFor="product-material-system" className="text-xs text-muted-foreground">Materials:</Label>
    <Select value={state.productFamily || 'custom'} onValueChange={value => {
      if (!value) return;
      const system = MATERIAL_SYSTEMS.find(s => s.value === value);
      state.handleMaterialSystemChange(system?.value);
    }}><SelectTrigger id="product-material-system" className="h-8 w-44"><SelectValue>{MATERIAL_SYSTEMS.find(s => s.value === state.productFamily)?.label || 'Custom / existing'}</SelectValue></SelectTrigger>
      <SelectContent><SelectItem value="custom">Custom / existing</SelectItem>{MATERIAL_SYSTEMS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
    </Select>
  </div>;
}
