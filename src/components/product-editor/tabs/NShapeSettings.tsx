import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ShapeConfig, Unit } from '../types';
import { getNShapeOpening } from '../canvas/utils/shape-path';

interface NShapeSettingsProps {
  shape: ShapeConfig;
  width: number;
  height: number;
  unit: Unit;
  onChange: (updates: Partial<ShapeConfig>) => void;
}

export default function NShapeSettings({ shape, width, height, unit, onChange }: NShapeSettingsProps) {
  const opening = getNShapeOpening(shape, width, height);
  const fields = [
    { key: 'cutoutWidth', label: 'Opening Width', fallback: opening.width, max: width },
    { key: 'cutoutHeight', label: 'Opening Height', fallback: opening.height, max: height },
    { key: 'cutoutOffset', label: 'Left Leg Width', fallback: opening.left, max: width - opening.width },
  ] as const;
  return (
    <div className="space-y-4">
      {fields.map(({ key, label, fallback, max }) => (
        <div key={key} className="space-y-1.5">
          <Label htmlFor={key} className="text-xs text-muted-foreground">{label} ({unit})</Label>
          <Input
            id={key} type="number" min={0} max={max} step="any"
            value={shape[key] ?? ''} placeholder={String(fallback)}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') onChange({ [key]: undefined });
              else if (Number.isFinite(Number(value))) onChange({ [key]: Math.max(0, Math.min(Number(value), max)) });
            }}
            className="h-8 text-sm"
          />
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        The opening starts at the bottom. Right leg: {width - opening.right} {unit}.
        Top bar: {opening.top} {unit}. Leave the left leg blank to center the opening.
      </p>
    </div>
  );
}
