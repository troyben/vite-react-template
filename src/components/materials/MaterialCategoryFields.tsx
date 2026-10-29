import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MaterialCategory } from '@/services/materialService';
import type { MaterialUsageProperties } from '@/services/materialUsageService';

const fields = {
  frame_profile: { title: 'Frame profile properties', label: 'Profile type', key: 'profileType',
    options: { outer_frame: 'Outer Frame', mullion: 'Mullion', transom: 'Transom', corner_post: 'Corner Post' } },
  glass: { title: 'Glass properties', label: 'Glass type', key: 'glassType',
    options: { clear: 'Clear', frosted: 'Frosted', 'custom-tint': 'Custom Tint' } },
  hardware: { title: 'Hardware properties', label: 'Hardware type', key: 'hardwareType',
    options: { handle: 'Handle', lock: 'Lock', hinge: 'Hinge', roller: 'Roller' } },
};
const profileHelp: Record<string, string> = {
  corner_post: 'Profiles joining connected sections at a corner.',
  outer_frame: 'The main perimeter frame that runs around the entire window or door opening.',
  mullion: 'Vertical divider bars between panels within the frame.',
  transom: 'Horizontal or vertical bars that subdivide individual panels into smaller panes.',
};
export function MaterialCategoryFields({ category, properties, onChange }: {
  category: MaterialCategory; properties: MaterialUsageProperties; onChange: (values: MaterialUsageProperties) => void;
}) {
  if (category === 'accessory') return null;
  const field = fields[category];
  const value = String(properties[field.key] || 'none');
  const options: Record<string, string> = field.options;
  return <section className="space-y-4 rounded-lg border p-4">
    <h3 className="font-medium">{field.title}</h3>
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2"><Label htmlFor={field.key}>{field.label}</Label>
        <Select value={value} onValueChange={v => { if (v) onChange({ ...properties, [field.key]: v === 'none' ? undefined : v }); }}>
          <SelectTrigger id={field.key} className="w-full"><SelectValue>{options[value] || 'Select'}</SelectValue></SelectTrigger>
          <SelectContent><SelectItem value="none">— None —</SelectItem>{Object.entries(options).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {category === 'glass' && <div className="space-y-2"><Label htmlFor="thickness">Thickness (mm)</Label>
        <Input id="thickness" type="number" step="0.1" min="0" value={typeof properties.thickness === 'number' ? properties.thickness : ''}
          onChange={e => onChange({ ...properties, thickness: e.target.value === '' ? undefined : Number(e.target.value) })} placeholder="e.g. 4" /></div>}
    </div>
    {category === 'frame_profile' && profileHelp[value] && <p className="text-xs text-muted-foreground">{profileHelp[value]}</p>}
  </section>;
}
