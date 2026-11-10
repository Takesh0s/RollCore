import { create } from 'zustand';

/** Opens/closes the quick roll window (menu item "Rolagem rápida"); the window is mounted in the root layout. */
export const useQuickRoll = create<{ open: boolean; setOpen: (open: boolean) => void }>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
