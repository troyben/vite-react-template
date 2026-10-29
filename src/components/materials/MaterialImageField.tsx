import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MATERIAL_IMAGE_TYPES } from '@/services/materialImageService';

export function MaterialImageField({ image, processing, error, onSelect, onRemove, disabled }: {
  image: string | null; processing: boolean; error: string;
  onSelect: (file: File) => Promise<void>; onRemove: () => void; disabled?: boolean;
}) {
  return <section className="space-y-3 rounded-lg border p-4" aria-label="Material image">
    <div><h3 className="font-medium">Material image <span className="font-normal text-muted-foreground">(optional)</span></h3>
      <p id="material-image-help" className="mt-1 text-xs text-muted-foreground">JPEG, PNG or WebP up to 10 MB. Automatically resized and compressed to 256 KB or less.</p></div>
    <div className="flex h-48 items-center justify-center overflow-hidden rounded-md border border-dashed bg-muted/20 sm:h-56">
      {image ? <img src={image} alt="Material preview" className="h-full w-full object-contain p-2" />
        : <div className="text-center text-muted-foreground"><ImagePlus className="mx-auto mb-2 h-8 w-8" /><p className="text-sm">No image selected</p></div>}
    </div>
    <div className="space-y-2"><Label htmlFor="material-image">{image ? 'Replace image' : 'Choose image'}</Label>
      <Input id="material-image" type="file" accept={MATERIAL_IMAGE_TYPES.join(',')} disabled={disabled || processing}
        aria-describedby="material-image-help" onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void onSelect(file); }} /></div>
    {processing && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Compressing image…</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {image && <Button type="button" variant="outline" size="sm" onClick={onRemove} disabled={disabled}><Trash2 className="h-4 w-4" />Remove image</Button>}
  </section>;
}
