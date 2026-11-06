import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { installCommonMaterials } from '@/services/materialService';
import { notify } from '@/utils/notifications';

export function CommonMaterialsButton({ onAdded }: { onAdded: () => void }) {
  const [busy, setBusy] = useState(false);
  return <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/20 p-3">
    <p className="min-w-0 flex-1 text-sm text-muted-foreground">Common Patio, Galaxy, Folding and Window materials. Editable estimating allowances; purchase rates need entry. Existing materials are kept.</p>
    <Button variant="outline" disabled={busy} onClick={async () => {
      setBusy(true);
      try {
        const result = await installCommonMaterials();
        notify.success(`Added ${result.created} common materials; kept ${result.existing} existing entries.`);
        onAdded();
      } catch { notify.error('Could not add common materials. Please retry.'); }
      finally { setBusy(false); }
    }}>{busy ? 'Adding…' : 'Add common materials'}</Button>
  </div>;
}
