import { create } from 'zustand';

export type ToastKind = 'info' | 'success' | 'error';

interface ToastState {
  message: string | null;
  kind: ToastKind;
  /** Shows a short message at the bottom of the screen (replaces the previous one). */
  show: (message: string, kind?: ToastKind) => void;
  hide: () => void;
}

let timer: ReturnType<typeof setTimeout> | undefined;

export const useToast = create<ToastState>((set) => ({
  message: null,
  kind: 'info',
  show(message, kind = 'info') {
    if (timer) clearTimeout(timer);
    set({ message, kind });
    timer = setTimeout(() => set({ message: null }), 3200);
  },
  hide() { if (timer) clearTimeout(timer); set({ message: null }); },
}));

/** Same as useToast.getState().show, for use outside components. */
export const showToast = (message: string, kind: ToastKind = 'info') => useToast.getState().show(message, kind);
