import { create } from 'zustand';

const STORAGE_KEY = 'sidebar.expanded';

const readInitial = (): boolean => {
  if (typeof window === 'undefined') return true;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === null ? true : v === 'true';
};

interface SidebarState {
  expanded: boolean;
  toggle: () => void;
  setExpanded: (v: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set, get) => ({
  expanded: readInitial(),
  toggle: () => {
    const next = !get().expanded;
    set({ expanded: next });
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    }
  },
  setExpanded: (v: boolean) => {
    set({ expanded: v });
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, String(v));
    }
  },
}));
