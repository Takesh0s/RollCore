import { create } from 'zustand';

/** Abre/fecha a busca rápida (campo do Início); a janela fica montada no layout raiz. */
export const useQuickSearch = create<{ open: boolean; setOpen: (open: boolean) => void }>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
