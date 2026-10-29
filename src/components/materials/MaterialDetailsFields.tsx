import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORY_OPTIONS, CURRENCY_OPTIONS, UNIT_OPTIONS } from '@/services/materialFormService';
import { CURRENCY_SYMBOLS } from '@/hooks/useMaterials';
import type { Material, MaterialCategory, MaterialUnit } from '@/services/materialService';

export function MaterialDetailsFields({ material, category, unit, currency, onCategory, onUnit, onCurrency }: {
  material: Material | null; category: MaterialCategory; unit: MaterialUnit; currency: string;
  onCategory: (value: MaterialCategory) => void; onUnit: (value: MaterialUnit) => void; onCurrency: (value: string) => void;
}) {
  return <section className="space-y-4 rounded-lg border p-4">
    <h3 className="font-medium">Material details</h3>
    <div className="grid gap-4 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="space-y-2"><Label htmlFor="name">Name *</Label><Input id="name" name="name" defaultValue={material?.name} placeholder="e.g. 65mm Outer Frame" required maxLength={255} /></div>
      <div className="space-y-2"><Label htmlFor="category">Category *</Label><Select value={category} onValueChange={v => { if (v) onCategory(v); }}>
        <SelectTrigger id="category" className="w-full"><SelectValue>{CATEGORY_OPTIONS.find(o => o.value === category)?.label}</SelectValue></SelectTrigger>
        <SelectContent>{CATEGORY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
    </div>
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="space-y-2"><Label htmlFor="unit">Unit *</Label><Select value={unit} onValueChange={v => { if (v) onUnit(v); }}>
        <SelectTrigger id="unit" className="w-full"><SelectValue>{UNIT_OPTIONS.find(o => o.value === unit)?.label}</SelectValue></SelectTrigger>
        <SelectContent>{UNIT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label htmlFor="currency">Currency *</Label><Select value={currency} onValueChange={v => { if (v) onCurrency(v); }}>
        <SelectTrigger id="currency" className="w-full"><SelectValue>{currency}</SelectValue></SelectTrigger>
        <SelectContent>{CURRENCY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label htmlFor="costPrice">Cost per unit ({CURRENCY_SYMBOLS[currency] || currency}) *</Label><Input id="costPrice" name="costPrice" type="number" step="0.01" min="0" defaultValue={material?.costPrice} placeholder="0.00" required /></div>
    </div>
    <p className="text-xs text-muted-foreground">Enter the cost for one {unit === 'per_meter' ? 'metre' : unit === 'per_sqm' ? 'square metre' : unit === 'per_kg' ? 'kilogram' : 'piece'}, not the full pack or length. For example, a 6 m profile costing $30 is $5 per metre.</p>
    <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" defaultValue={material?.description} placeholder="Optional description…" rows={4} /></div>
  </section>;
}
