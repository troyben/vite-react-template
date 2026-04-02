import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">System Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure default rates and system-wide preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Default Rates</CardTitle>
          <CardDescription>
            These rates are auto-populated when a sketch is added to a quotation line item. Users can always override them manually.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="doorRate">Default Door Rate (per m&sup2;)</Label>
            <Input
              id="doorRate"
              type="number"
              min="0"
              step="0.01"
              value={doorRate}
              onChange={(e) => setDoorRate(e.target.value)}
              placeholder="e.g. 1200"
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              Applied automatically when a door sketch is attached to a quotation item with no rate set.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="windowRate">Default Window Rate (per m&sup2;)</Label>
            <Input
              id="windowRate"
              type="number"
              min="0"
              step="0.01"
              value={windowRate}
              onChange={(e) => setWindowRate(e.target.value)}
              placeholder="e.g. 950"
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              Applied automatically when a window sketch is attached to a quotation item with no rate set.
            </p>
          </div>

          <div className="pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettings;
