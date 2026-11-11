import { create } from 'zustand';
import { request } from '../services/api';

export type NotificationType =
  | 'MEMBER_JOINED' | 'MEMBER_LEFT' | 'ROLE_CHANGED' | 'REMOVED_FROM_TABLE'
  | 'HOST_TRANSFERRED' | 'TABLE_DELETED' | 'EVENT_CREATED';

/** Como a API devolve; a frase é montada aqui a partir do tipo e dos dados guardados. */
export interface AppNotification {
  id: string;
  type: NotificationType;
  tableId: string | null;
  eventId: string | null;
  tableName: string | null;
  actorName: string | null;
  detail: string | null;
  read: boolean;
  createdAt: string;
}

interface NotificationsState {
  items: AppNotification[];
  unread: number;
  loading: boolean;
  loaded: boolean;
  load: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  clear: () => void;
}

/** Notificações dentro do app (GET /notifications). */
export const useNotifications = create<NotificationsState>((set, get) => ({
  items: [],
  unread: 0,
  loading: false,
  loaded: false,

  async load() {
    set({ loading: true });
    try {
      const data = await request<{ items: AppNotification[]; unread: number }>('/notifications');
      set({ items: data.items, unread: data.unread, loaded: true });
    } catch {
      // mantém o que já está na tela; tenta de novo no próximo ciclo
    } finally {
      set({ loading: false });
    }
  },

  async markRead(id) {
    const target = get().items.find((n) => n.id === id);
    if (!target || target.read) return;
    set((s) => ({ items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)), unread: Math.max(0, s.unread - 1) }));
    try { await request(`/notifications/${id}/read`, { method: 'POST' }); } catch { void get().load(); }
  },

  async markAllRead() {
    set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })), unread: 0 }));
    try { await request('/notifications/read-all', { method: 'POST' }); } catch { void get().load(); }
  },

  clear: () => set({ items: [], unread: 0, loading: false, loaded: false }),
}));
