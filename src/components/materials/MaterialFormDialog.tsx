import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Material, CreateMaterialData } from '@/services/materialService';
import { useMaterialForm } from '@/hooks/useMaterialForm';
import { MaterialDetailsFields } from './MaterialDetailsFields';
import { MaterialCategoryFields } from './MaterialCategoryFields';
import { MaterialUsageFields } from './MaterialUsageFields';
import { MaterialImageField } from './MaterialImageField';
import { MaterialSystemFields } from './MaterialSystemFields';

interface MaterialFormDialogProps {
  open: boolean; onOpenChange: (open: boolean) => void; editingMaterial: Material | null;
  onSubmit: (data: CreateMaterialData) => void; onCancel: () => void; submitting?: boolean;
}

export function MaterialFormDialog(props: MaterialFormDialogProps) {
  return <Dialog open={props.open} onOpenChange={props.onOpenChange} disablePointerDismissal>
    <DialogContent className="flex max-h-[90dvh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:w-[80vw] sm:max-w-none">
      <DialogHeader className="shrink-0 border-b px-6 py-3 pr-12">
        <DialogTitle>{props.editingMaterial ? 'Edit Material' : 'Add New Material'}</DialogTitle>
        <DialogDescription className="text-xs leading-4">Set material details, pricing and automatic usage. An image is optional.</DialogDescription>
      </DialogHeader>
      {props.open && <MaterialForm key={props.editingMaterial?.id ?? 'new'} {...props} />}
    </DialogContent>
  </Dialog>;
}

function MaterialForm({ editingMaterial, onSubmit, onCancel, submitting }: MaterialFormDialogProps) {
  const form = useMaterialForm(editingMaterial, onSubmit);
  const { category, unit, currency, properties, photo } = form;
  return <form className="flex min-h-0 flex-1 flex-col" onSubmit={form.submit}>
    <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
      <fieldset disabled={submitting} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,1fr)]">
        <div className="min-w-0 space-y-6">
          <MaterialDetailsFields material={editingMaterial} category={category} unit={unit} currency={currency}
            onCategory={form.changeCategory} unitOptions={form.policy?.units} onUnit={form.changeUnit} onCurrency={form.setCurrency} />
          <MaterialCategoryFields category={category} properties={properties} onChange={form.changeCategoryProperties} />
          <MaterialSystemFields properties={properties} onChange={form.setProperties} />
        </div>
        <div className="min-w-0 space-y-6">
          <MaterialImageField image={photo.image} processing={photo.processing} error={photo.error}
            onSelect={photo.select} onRemove={photo.remove} disabled={submitting} />
          <MaterialUsageFields category={category} properties={properties} onChange={form.setProperties}
            policy={form.policy} error={form.usageError} />
        </div>
      </fieldset>
    </div>
    <DialogFooter className="m-0 shrink-0 px-6">
      <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      <Button type="submit" disabled={submitting || photo.processing || !!form.usageError}>
        {submitting ? 'Saving…' : photo.processing ? 'Preparing image…' : editingMaterial ? 'Save Changes' : 'Add Material'}
      </Button>
    </DialogFooter>
  </form>;
}
