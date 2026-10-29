import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Material } from '@/services/materialService';
import type { CostingLine, CostingSnapshot } from '@/services/costingTypes';
import { materialLine, costingMoney } from '@/services/costingService';
import { COSTING_UNITS } from '@/services/costingTypes';
import { CostingLineRow } from './CostingLineRow';

export function CostingMaterials({ snapshot, materials, onLinesChange, onLineChange }: {
  snapshot: CostingSnapshot; materials: Material[];
  onLinesChange: (lines: CostingLine[]) => void; onLineChange: (id: string, change: Partial<CostingLine>) => void;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const options = materials.filter(m => (m.currency || 'USD') === snapshot.currency && m.name.toLowerCase().includes(search.toLowerCase()));
  const add = () => {
    const material = materials.find(m => String(m.id) === selected && (m.currency || 'USD') === snapshot.currency);
    if (material) { onLinesChange([...snapshot.lines, materialLine(material)]); setSelected(null); }
  };
  return <section className="rounded-xl border bg-card">
    <div className="space-y-3 border-b p-4">
      <div><h2 className="font-semibold">Bill of materials</h2><p className="text-sm text-muted-foreground">Net quantity + wastage = quantity to buy. Pieces are rounded up.</p></div>
      <div className="flex flex-wrap gap-2">
        <Input className="sm:w-52" aria-label="Search catalogue materials" placeholder="Search materials…" value={search} onChange={e => setSearch(e.target.value)} />
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="w-full sm:w-80" aria-label="Choose a material"><SelectValue placeholder="Choose a material to add">{selected ? materials.find(m => String(m.id) === selected)?.name : undefined}</SelectValue></SelectTrigger>
          <SelectContent>{options.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name} · {costingMoney(m.costPrice, snapshot.currency)}/{COSTING_UNITS[m.unit]}</SelectItem>)}</SelectContent>
        </Select>
        <Button type="button" variant="outline" onClick={add} disabled={!selected}><Plus className="h-4 w-4" />Add material</Button>
      </div>
      {options.length === 0 && <p className="text-sm text-muted-foreground">No matching materials in {snapshot.currency}. Ask an administrator to add one in Materials.</p>}
    </div>
    {snapshot.lines.length === 0 ? <div className="p-10 text-center"><h3 className="font-medium">Configure automatic usage in Materials</h3><p className="mt-2 text-sm text-muted-foreground">Enable default materials for doors or windows, then refresh this quotation to calculate what it uses.</p></div> :
      <Table><TableHeader><TableRow>{['Material', 'Net qty', 'Unit', 'Waste %', 'Buy qty', `Rate (${snapshot.currency})`, 'Amount', ''].map((h, i) => <TableHead key={i}>{h}</TableHead>)}</TableRow></TableHeader>
        <TableBody>{snapshot.lines.map(line => <CostingLineRow key={line.id} line={line} currency={snapshot.currency} materials={materials}
          onChange={change => onLineChange(line.id, change)} onRemove={() => onLinesChange(snapshot.lines.filter(l => l.id !== line.id))} />)}</TableBody></Table>}
  </section>;
}
