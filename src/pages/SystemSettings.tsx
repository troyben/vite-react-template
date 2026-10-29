import { PageHeader } from '@/components/PageHeader';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DefaultRatesForm from '@/components/settings/DefaultRatesForm';
import { useSystemSettings } from '@/hooks/useSystemSettings';

const SystemSettings = () => {
  const { doorRate, windowRate, setDoorRate, setWindowRate, handleSave, saving, loaded } = useSystemSettings();

  if (!loaded) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader>
        <div>
          <h1 className="text-2xl font-semibold">System Settings</h1>
          <p className="text-muted-foreground">Manage default quotation rates.</p>
        </div>
        <Button type="submit" form="system-settings" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </PageHeader>

      <div className="max-w-4xl">
        <DefaultRatesForm
          doorRate={doorRate}
          windowRate={windowRate}
          saving={saving}
          onDoorRateChange={setDoorRate}
          onWindowRateChange={setWindowRate}
          onSave={handleSave}
        />
      </div>
    </div>
  );
};

export default SystemSettings;
