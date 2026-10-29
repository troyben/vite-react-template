import { MapPin, Phone, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { QuotationItem } from '@/services/quotationService';
import type { QuotationItemEditing } from './quotationItemEditing';
import { QuotationItemMobile } from './QuotationItemMobile';
import { QuotationItemRow } from './QuotationItemRow';

interface QuotationItemsCardProps { items: QuotationItem[]; client?: { name: string; phone?: string; address?: string } | null; editing?: QuotationItemEditing; onSelectClient?: () => void }
export const QuotationItemsCard: React.FC<QuotationItemsCardProps> = ({ items, client, editing, onSelectClient }) => (
  <Card className="gap-0 py-0">
    <CardHeader className="flex flex-wrap items-center gap-2 border-b px-3 py-2"><CardTitle className="mr-2 text-sm">Line Items</CardTitle>
      <div className="order-3 flex min-w-0 flex-1 basis-full items-center gap-2 sm:order-none sm:basis-auto"><span className="shrink-0 text-xs text-muted-foreground">Client:</span>
        {client ? <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-0.5"><span className="truncate text-xs font-semibold">{client.name}</span>
          {client.phone && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{client.phone}</span>}
          {client.address && <span className="flex min-w-0 items-center gap-1 truncate text-xs text-muted-foreground"><MapPin className="h-3 w-3 shrink-0" />{client.address}</span>}</div>
          : <span className="min-w-0 flex-1 text-xs italic text-muted-foreground">No client selected</span>}
        {onSelectClient && <Button type="button" variant="outline" size="sm" className="h-7 shrink-0 text-xs" onClick={onSelectClient}>{client ? 'Change' : 'Select Client'}</Button>}
      </div>
      {editing && <Button type="button" variant="outline" size="sm" className="ml-auto h-7 text-xs sm:ml-0" onClick={editing.onAdd}><Plus className="h-3.5 w-3.5" />Add Item</Button>}
    </CardHeader>
    <CardContent className="p-0">
      <div className="@container space-y-2 p-2 md:hidden">{items.map((item, index) => <QuotationItemMobile key={item.id ?? index} item={item} index={index} count={items.length} editing={editing} />)}</div>
      <div className="hidden md:block"><Table className="[&_th]:h-8 [&_th]:text-xs"><TableHeader><TableRow>
        <TableHead className="w-10">#</TableHead><TableHead className="w-[172px]">Sketch</TableHead><TableHead className="w-[23%]">Item</TableHead><TableHead>Description</TableHead>
        <TableHead className="w-16">Qty</TableHead><TableHead className="w-24">Rate</TableHead><TableHead className="w-24">Price</TableHead><TableHead className="w-24 text-right">Total</TableHead>{editing && <TableHead className="w-10" />}
      </TableRow></TableHeader><TableBody>{items.map((item, index) => <QuotationItemRow key={item.id ?? index} item={item} index={index} count={items.length} editing={editing} />)}</TableBody></Table></div>
      {editing && <div className="border-t px-3 py-1"><button type="button" onClick={editing.onAdd} className="flex items-center gap-1.5 py-1 text-xs text-muted-foreground transition-colors hover:text-primary"><Plus className="h-3.5 w-3.5" />Add another item</button></div>}
    </CardContent>
  </Card>
);
