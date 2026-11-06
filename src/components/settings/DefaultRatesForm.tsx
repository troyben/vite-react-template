import { DoorOpen, PanelsTopLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CURRENCY } from '@/config/currency';

interface DefaultRatesFormProps {
  doorRate: string;
  windowRate: string;
  saving: boolean;
  onDoorRateChange: (value: string) => void;
  onWindowRateChange: (value: string) => void;
  onSave: () => Promise<void>;
}

export default function DefaultRatesForm({ doorRate, windowRate, saving, onDoorRateChange, onWindowRateChange, onSave }: DefaultRatesFormProps) {
  const fields = [
    { id: 'doorRate', title: 'Doors', label: 'Default door rate', icon: DoorOpen, value: doorRate, onChange: onDoorRateChange },
    { id: 'windowRate', title: 'Windows', label: 'Default window rate', icon: PanelsTopLeft, value: windowRate, onChange: onWindowRateChange },
  ];

  return (
    <form id="system-settings" onSubmit={event => { event.preventDefault(); void onSave(); }}>
      <Card>
        <CardHeader className="gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Default quotation rates</CardTitle>
            <Badge variant="secondary">{CURRENCY.code} / m²</Badge>
          </div>
          <CardDescription>Default selling prices per square metre for quotation items.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-8">
          {fields.map(field => (
            <section key={field.id} aria-labelledby={`${field.id}-heading`} className="min-w-0 space-y-3">
              <h2 id={`${field.id}-heading`} className="flex items-center gap-2 font-medium">
                <field.icon className="size-4 text-muted-foreground" aria-hidden="true" />
                {field.title}
              </h2>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor={field.id}>{field.label}</Label>
                <div className="relative">
                  <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">{CURRENCY.symbol}</span>
                  <Input
                    id={field.id}
                    type="number"
                    min="0"
                    step="0.01"
                    value={field.value}
                    onChange={event => field.onChange(event.target.value)}
                    placeholder="0.00"
                    aria-describedby="default-rates-help"
                    disabled={saving}
                    className="pl-7"
                  />
                </div>
              </div>
            </section>
          ))}
        </CardContent>
        <CardFooter>
          <p id="default-rates-help" className="text-xs leading-relaxed text-muted-foreground">
            Applied when a sketch is added to an item with no rate set. Users can change the rate on each quotation item.
          </p>
        </CardFooter>
      </Card>
    </form>
  );
}
