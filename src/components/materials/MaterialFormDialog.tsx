import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Material, MaterialCategory, MaterialUnit, CreateMaterialData } from '@/services/materialService';
import { MaterialUsageFields } from './MaterialUsageFields';
import { CURRENCY_SYMBOLS } from '@/hooks/useMaterials';

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'ZAR', label: 'ZAR — South African Rand' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'INR', label: 'INR — Indian Rupee' },
  { value: 'AUD', label: 'AUD — Australian Dollar' },
  { value: 'CAD', label: 'CAD — Canadian Dollar' },
  { value: 'CNY', label: 'CNY — Chinese Yuan' },
];

interface MaterialFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingMaterial: Material | null;
  onSubmit: (data: CreateMaterialData) => void;
  onCancel: () => void;
  submitting?: boolean;
}

const CATEGORY_OPTIONS: { value: MaterialCategory; label: string }[] = [
  { value: 'frame_profile', label: 'Frame Profile' },
  { value: 'glass', label: 'Glass' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'accessory', label: 'Accessory' },
];

const UNIT_OPTIONS: { value: MaterialUnit; label: string }[] = [
  { value: 'per_meter', label: 'Per Meter' },
  { value: 'per_sqm', label: 'Per Square Meter' },
  { value: 'per_piece', label: 'Per Piece' },
  { value: 'per_kg', label: 'Per Kilogram' },
];

const DEFAULT_UNITS: Record<MaterialCategory, MaterialUnit> = {
  frame_profile: 'per_meter',
  glass: 'per_sqm',
  hardware: 'per_piece',
  accessory: 'per_piece',
};

export function MaterialFormDialog({
  open,
  onOpenChange,
  editingMaterial,
  onSubmit,
  onCancel,
  submitting,
}: MaterialFormDialogProps) {
  const [category, setCategory] = useState<MaterialCategory>('frame_profile');
  const [unit, setUnit] = useState<MaterialUnit>('per_meter');
  const [currency, setCurrency] = useState('USD');
  const [properties, setProperties] = useState<Record<string, any>>({});

  useEffect(() => {
    if (editingMaterial) {
      setCategory(editingMaterial.category);
      setUnit(editingMaterial.unit);
      setCurrency(editingMaterial.currency || 'USD');
      setProperties(editingMaterial.properties ?? {});
    } else {
      setCategory('frame_profile');
      setUnit('per_meter');
      setCurrency('USD');
      setProperties({});
    }
  }, [editingMaterial, open]);

  const handleCategoryChange = (value: MaterialCategory) => {
    setCategory(value);
    if (!editingMaterial) {
      setUnit(DEFAULT_UNITS[value]);
    }
    setProperties({});
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data: CreateMaterialData = {
      name: (formData.get('name') as string).trim(),
      category,
      description: (formData.get('description') as string) || undefined,
      unit,
      costPrice: parseFloat(formData.get('costPrice') as string),
      currency,
      properties: Object.keys(properties).length > 0 ? properties : undefined,
    };

    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingMaterial ? 'Edit Material' : 'Add New Material'}
          </DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editingMaterial?.name}
                placeholder="e.g. 65mm Outer Frame"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={(v) => { if (v !== null) handleCategoryChange(v); }}>
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="Select category">{CATEGORY_OPTIONS.find(o => o.value === category)?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="unit">Unit *</Label>
              <Select value={unit} onValueChange={(v) => setUnit(v as MaterialUnit)}>
                <SelectTrigger id="unit" className="w-full">
                  <SelectValue placeholder="Select unit">{UNIT_OPTIONS.find(o => o.value === unit)?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency *</Label>
              <Select value={currency} onValueChange={(v) => { if (v !== null) setCurrency(v); }}>
                <SelectTrigger id="currency" className="w-full">
                  <SelectValue placeholder="Select currency">{currency}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="costPrice">Cost per unit ({CURRENCY_SYMBOLS[currency] || currency}) *</Label>
              <Input
                id="costPrice"
                name="costPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={editingMaterial?.costPrice}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">Enter the cost for one {unit === 'per_meter' ? 'metre' : unit === 'per_sqm' ? 'square metre' : unit === 'per_kg' ? 'kilogram' : 'piece'}, not the full pack or length. For example, a 6 m profile costing $30 is $5 per metre.</p>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={editingMaterial?.description}
              placeholder="Optional description..."
              rows={2}
            />
          </div>

          <CategoryProperties
            category={category}
            properties={properties}
            onChange={setProperties}
          />

          <MaterialUsageFields category={category} unit={unit} properties={properties} onChange={setProperties} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : editingMaterial ? 'Save Changes' : 'Add Material'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CategoryProperties({
  category,
  properties,
  onChange,
}: {
  category: MaterialCategory;
  properties: Record<string, any>;
  onChange: (props: Record<string, any>) => void;
}) {
  const update = (key: string, value: any) => {
    onChange({ ...properties, [key]: value });
  };

  if (category === 'frame_profile') {
    const profileHelp: Record<string, string> = {
      outer_frame: 'The main perimeter frame that runs around the entire window or door opening.',
      mullion: 'Vertical divider bars between panels within the frame.',
      transom: 'Horizontal or vertical bars that subdivide individual panels into smaller panes.',
    };
    return (
      <div className="rounded-md border p-3 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Frame Profile Properties</p>
        <div className="grid gap-2">
          <Label htmlFor="profileType">Profile Type</Label>
          <Select
            value={properties.profileType || 'none'}
            onValueChange={(v) => update('profileType', v === 'none' ? undefined : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select profile type">{({ outer_frame: 'Outer Frame', mullion: 'Mullion', transom: 'Transom' } as Record<string, string>)[properties.profileType] || "Select"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— None —</SelectItem>
              <SelectItem value="outer_frame">Outer Frame</SelectItem>
              <SelectItem value="mullion">Mullion</SelectItem>
              <SelectItem value="transom">Transom</SelectItem>
            </SelectContent>
          </Select>
          {properties.profileType && profileHelp[properties.profileType] && (
            <p className="text-xs text-muted-foreground">{profileHelp[properties.profileType]}</p>
          )}
        </div>
      </div>
    );
  }

  if (category === 'glass') {
    return (
      <div className="rounded-md border p-3 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Glass Properties</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="glassType">Glass Type</Label>
            <Select
              value={properties.glassType || ''}
              onValueChange={(v) => update('glassType', v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select glass type">{({ clear: 'Clear', frosted: 'Frosted', 'custom-tint': 'Custom Tint' } as Record<string, string>)[properties.glassType] || "Select"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clear">Clear</SelectItem>
                <SelectItem value="frosted">Frosted</SelectItem>
                <SelectItem value="custom-tint">Custom Tint</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="thickness">Thickness (mm)</Label>
            <Input
              id="thickness"
              type="number"
              step="0.1"
              min="0"
              value={properties.thickness || ''}
              onChange={(e) => update('thickness', parseFloat(e.target.value) || undefined)}
              placeholder="e.g. 4"
            />
          </div>
        </div>
      </div>
    );
  }

  if (category === 'hardware') {
    return (
      <div className="rounded-md border p-3 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hardware Properties</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="hardwareType">Hardware Type</Label>
            <Select
              value={properties.hardwareType || ''}
              onValueChange={(v) => update('hardwareType', v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type">{({ handle: 'Handle', lock: 'Lock', hinge: 'Hinge', roller: 'Roller' } as Record<string, string>)[properties.hardwareType] || "Select"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="handle">Handle</SelectItem>
                <SelectItem value="lock">Lock</SelectItem>
                <SelectItem value="hinge">Hinge</SelectItem>
                <SelectItem value="roller">Roller</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
