import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/config/currency';
import { computeTotals } from '@/utils/quotationTotals';
import { boundedQuotationNumber, fixedQuotationDiscount } from '@/services/quotationPresentationService';

interface QuotationTotalsProps { subtotal: number; vatPercent: number; transportFee: number; discountAmount?: number; onChange?: (values: { vat_percent?: number; transport_fee?: number; discount_amount?: number }) => void }
export const QuotationTotals: React.FC<QuotationTotalsProps> = ({ subtotal, vatPercent, transportFee, discountAmount = 0, onChange }) => {
  const { vatAmount, grandTotal } = computeTotals(subtotal, vatPercent, transportFee, discountAmount);
  return <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-end md:gap-6"><div className="flex w-full flex-col items-stretch gap-3 md:w-auto md:min-w-[320px] md:items-end">
    <Card className="w-full gap-0 py-0"><CardContent className="space-y-2 p-3"><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <div><Label htmlFor="vat_percent" className="text-xs text-muted-foreground">VAT (%)</Label><Input id="vat_percent" type="number" min="0" max="100" step="0.01" value={vatPercent === 0 && onChange ? '' : vatPercent}
        readOnly={!onChange} onFocus={onChange ? event => event.currentTarget.select() : undefined} onChange={onChange ? event => onChange({ vat_percent: boundedQuotationNumber(event.target.value, 100) }) : undefined} className="h-8 text-sm" /></div>
      <div><Label htmlFor="transport_fee" className="text-xs text-muted-foreground">Transport fee</Label><Input id="transport_fee" type="number" min="0" step="0.01" value={transportFee === 0 && onChange ? '' : transportFee}
        readOnly={!onChange} onFocus={onChange ? event => event.currentTarget.select() : undefined} onChange={onChange ? event => onChange({ transport_fee: boundedQuotationNumber(event.target.value) }) : undefined} className="h-8 text-sm" /></div>
      <div className="sm:col-span-2"><Label htmlFor="discount_amount" className="text-xs text-muted-foreground">Discount (fixed amount)</Label><Input id="discount_amount" type="number" min="0" max="9999999999.99" step="0.01" value={discountAmount === 0 && onChange ? '' : discountAmount}
        readOnly={!onChange} onFocus={onChange ? event => event.currentTarget.select() : undefined} onChange={onChange ? event => onChange({ discount_amount: fixedQuotationDiscount(event.target.value) }) : undefined} className="h-8 text-sm" /></div>
    </div><div className="space-y-1 border-t pt-2 text-sm">
      <div className="flex items-center justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium tabular-nums">{formatCurrency(subtotal)}</span></div>
      <div className="flex items-center justify-between"><span className="text-muted-foreground">VAT ({vatPercent}%)</span><span className="font-medium tabular-nums">{formatCurrency(vatAmount)}</span></div>
      <div className="flex items-center justify-between"><span className="text-muted-foreground">Transport</span><span className="font-medium tabular-nums">{formatCurrency(transportFee)}</span></div>
      {discountAmount > 0 && <div className="flex items-center justify-between"><span className="text-muted-foreground">Discount</span><span className="font-medium tabular-nums">−{formatCurrency(discountAmount)}</span></div>}
      <div className="mt-1 flex items-center justify-between border-t pt-1.5"><span className="text-sm font-semibold">Grand Total</span><span className="text-xl font-bold tabular-nums">{formatCurrency(grandTotal)}</span></div>
    </div></CardContent></Card>
  </div></div>;
};
