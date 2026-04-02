import { create } from 'zustand';
import { getAllSystemSettings } from '../services/systemSettingsService';

interface SystemSettingsState {
  settings: Record<string, string>;
  loaded: boolean;
  loading: boolean;
  fetchSettings: () => Promise<void>;
  getSetting: (key: string) => string | undefined;
  getNumberSetting: (key: string) => number | undefined;
  updateSettings: (newSettings: Record<string, string>) => void;
}

export const useSystemSettingsStore = create<SystemSettingsState>((set, get) => ({
  settings: {},
  loaded: false,
  loading: false,

  fetchSettings: async () => {
    if (get().loaded) return;
    set({ loading: true });
    try {
      const response = await getAllSystemSettings();
      if (response.data?.success && Array.isArray(response.data.data)) {
        const map: Record<string, string> = {};
        for (const item of response.data.data) {
          map[item.key] = item.value;
        }
        set({ settings: map, loaded: true });
      }
    } catch {
      // Silently fail — settings are optional defaults
    } finally {
      set({ loading: false });
    }
  },

  getSetting: (key: string) => {
    return get().settings[key];
  },

  getNumberSetting: (key: string) => {
    const val = get().settings[key];
    if (val === undefined || val === '') return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  },

  updateSettings: (newSettings: Record<string, string>) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    }));
  },
}));
