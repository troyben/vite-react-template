import { useState, useEffect } from 'react';
import { useSystemSettingsStore } from '@/stores/systemSettingsStore';
import { updateSystemSettings } from '@/services/systemSettingsService';
import { notify } from '@/utils/notifications';

export function useSystemSettings() {
  const { settings, loaded, loading, fetchSettings, updateSettings: updateStore } = useSystemSettingsStore();

  const [doorRate, setDoorRate] = useState('');
  const [windowRate, setWindowRate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (loaded) {
      setDoorRate(settings['default_door_rate'] || '');
      setWindowRate(settings['default_window_rate'] || '');
    }
  }, [loaded, settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSystemSettings([
        { key: 'default_door_rate', value: doorRate },
        { key: 'default_window_rate', value: windowRate },
      ]);
      updateStore({
        default_door_rate: doorRate,
        default_window_rate: windowRate,
      });
      notify.success('System settings saved successfully');
    } catch {
      notify.error('Failed to save system settings');
    } finally {
      setSaving(false);
    }
  };

  return {
    doorRate,
    windowRate,
    setDoorRate,
    setWindowRate,
    handleSave,
    saving,
    loaded: loaded && !loading,
  };
}
