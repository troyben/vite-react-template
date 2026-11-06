import { Button } from '@/components/ui/button';
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList, ComboboxTrigger, ComboboxValue } from '@/components/ui/combobox';
import { matchesOption, type DescribedOption } from '@/services/describedOptions';

interface DescribedSelectProps {
  id?: string; label: string; value?: string; options: DescribedOption[]; placeholder?: string;
  disabled?: boolean; onChange: (value: string) => void;
}
export const DescribedSelect: React.FC<DescribedSelectProps> = ({ id, label, value, options, placeholder = 'Select…', disabled, onChange }) => (
  <Combobox items={options} value={options.find(option => option.value === value) ?? null}
    isItemEqualToValue={(a, b) => a.value === b.value} filter={matchesOption}
    onValueChange={option => { if (option) onChange(option.value); }} disabled={disabled}>
    <ComboboxTrigger id={id} aria-label={label} render={<Button type="button" variant="outline" className="h-8 w-full justify-between px-2.5 font-normal" />}>
      <span className="truncate"><ComboboxValue placeholder={placeholder} /></span>
    </ComboboxTrigger>
    <ComboboxContent className="min-w-0 shadow-xl">
      <ComboboxInput aria-label={`Search ${label.toLowerCase()}`} placeholder="Search by name or description…" showTrigger={false} className="w-auto" />
      <ComboboxEmpty>No matches found.</ComboboxEmpty>
      <ComboboxList>{(option: DescribedOption) => <ComboboxItem key={option.value} value={option} className="items-start py-2">
        <div className="min-w-0"><div className="font-medium">{option.label}</div><p className="mt-0.5 text-xs leading-4 text-muted-foreground">{option.description}</p></div>
      </ComboboxItem>}</ComboboxList>
    </ComboboxContent>
  </Combobox>
);
