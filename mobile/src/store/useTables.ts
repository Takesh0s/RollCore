import { create } from 'zustand';
import { ApiError, mensagemDeErro, request } from '../services/api';
import { uploadImage, type PreparedImage } from '../lib/mapImage';
import { showToast } from './useToast';

export type TableRole = 'MASTER' | 'MODERATOR' | 'PLAYER';

export interface TableSummary {
  id: string;
  name: string;
  gameSystem: string;
  description: string | null;
  maxPlayers: number;
  playerCount: number;
  coverUrl: string | null;
  myRole: TableRole;
  ownerUsername: string;
  createdAt: string;
}

export interface TableMember {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: TableRole;
  joinedAt: string;
}

export interface TableMemberSelf { displayName: string | null; avatarUrl: string | null; muted: boolean; role: TableRole }

export interface TableDetail {
  table: TableSummary;
  /** Só vem para mestre e moderadores. */
  inviteCode: string | null;
  members: TableMember[];
  me?: TableMemberSelf;
  canTransferHost?: boolean;
}

export interface TablePreview {
  name: string;
  gameSystem: string;
  description: string | null;
  coverUrl: string | null;
  playerCount: number;
  maxPlayers: number;
  ownerUsername: string;
  full: boolean;
}

export interface TableInput {
  name: string;
  gameSystem: string;
  description: string;
  maxPlayers: number;
  /** Nova capa (já recortada); omitir mantém a atual. */
  cover?: PreparedImage | null;
  removeCover?: boolean;
}

export type OpenResult = 'ok' | 'notfound' | 'error';

interface TablesState {
  tables: TableSummary[];
  loading: boolean;
  loaded: boolean;
  failed: boolean;
  detail: TableDetail | null;
  load: () => Promise<void>;
  open: (id: string) => Promise<OpenResult>;
  create: (input: TableInput) => Promise<{ ok: true; detail: TableDetail } | { ok: false; status: number; error: string }>;
  update: (id: string, input: TableInput) => Promise<boolean>;
  preview: (code: string) => Promise<TablePreview | null>;
  join: (code: string) => Promise<TableDetail | null>;
  remove: (id: string) => Promise<boolean>;
  leave: (id: string) => Promise<boolean>;
  removeMember: (tableId: string, userId: string) => Promise<boolean>;
  regenerateInvite: (tableId: string) => Promise<void>;
  updateMyProfile: (tableId: string, input: { displayName: string; muted: boolean; avatar?: PreparedImage | null }) => Promise<boolean>;
  changeRole: (tableId: string, userId: string, role: 'MODERATOR' | 'PLAYER') => Promise<boolean>;
  transferHost: (tableId: string, userId: string) => Promise<boolean>;
  clear: () => void;
}

const putFirst = (list: TableSummary[], t: TableSummary) => [t, ...list.filter((x) => x.id !== t.id)];

/** Mesas do usuário e a mesa aberta, guardadas no servidor (mesmas regras do web). */
export const useTables = create<TablesState>((set, get) => {
  /** Roda uma ação que mostra um aviso de erro com `fallback` quando falha. */
  async function attempt(job: () => Promise<void>, fallback: string): Promise<boolean> {
    try { await job(); return true; } catch (e) {
      showToast(e instanceof ApiError && e.message ? e.message : fallback, 'error');
      return false;
    }
  }
  const reload = async (tableId: string) => { set({ detail: await request<TableDetail>(`/tables/${tableId}`) }); };

  return {
    tables: [],
    loading: false,
    loaded: false,
    failed: false,
    detail: null,

    async load() {
      set({ loading: true });
      try {
        const data = await request<TableSummary[]>('/tables');
        if (Array.isArray(data)) set({ tables: data, loaded: true, failed: false });
      } catch {
        set({ failed: true });
      } finally {
        set({ loading: false });
      }
    },

    async open(id) {
      set({ detail: null });
      try {
        await reload(id);
        return 'ok';
      } catch (e) {
        return e instanceof ApiError && e.status === 404 ? 'notfound' : 'error';
      }
    },

    async create(input) {
      try {
        // A capa vai ao servidor para valer em todos os aparelhos; se o envio falhar, a mesa é criada sem ela.
        const coverUrl = input.cover ? await uploadImage(input.cover) : null;
        const detail = await request<TableDetail>('/tables', {
          method: 'POST',
          body: {
            name: input.name.trim(),
            coverUrl: coverUrl ?? undefined,
            gameSystem: input.gameSystem.trim() || undefined,
            description: input.description.trim() || undefined,
            maxPlayers: input.maxPlayers,
          },
        });
        if (input.cover && !coverUrl) showToast('A capa não foi enviada ao servidor. Você pode adicioná-la editando a mesa.', 'error');
        set({ tables: putFirst(get().tables, detail.table) });
        return { ok: true, detail };
      } catch (e) {
        const error = mensagemDeErro(e);
        showToast(error, 'error');
        return { ok: false, status: e instanceof ApiError ? e.status : 0, error };
      }
    },

    async update(id, input) {
      const current = get().tables.find((t) => t.id === id) ?? get().detail?.table;
      let coverUrl = input.removeCover ? null : (current?.coverUrl ?? null);
      if (input.cover) {
        const uploaded = await uploadImage(input.cover);
        if (!uploaded) { showToast('Não foi possível enviar a capa. Tente de novo.', 'error'); return false; }
        coverUrl = uploaded;
      }
      return attempt(async () => {
        const data = await request<TableDetail>(`/tables/${id}`, {
          method: 'PUT',
          body: {
            name: input.name.trim(),
            gameSystem: input.gameSystem.trim(),
            description: input.description.trim() || undefined,
            maxPlayers: input.maxPlayers,
            coverUrl: coverUrl ?? undefined,
          },
        });
        set((s) => ({
          tables: s.tables.map((t) => (t.id === id ? data.table : t)),
          detail: s.detail?.table.id === id ? { ...s.detail, table: data.table } : s.detail,
        }));
        // A imagem anterior deixou de ser usada; apagar é "melhor esforço" (só quem enviou pode).
        const old = current?.coverUrl;
        if ((input.cover || input.removeCover) && old?.startsWith('/images/') && old !== coverUrl) {
          void request<void>(old, { method: 'DELETE' }).catch(() => undefined);
        }
      }, 'Não foi possível salvar a mesa.');
    },

    async preview(code) {
      try { return await request<TablePreview>(`/tables/preview/${encodeURIComponent(code.trim())}`); } catch { return null; }
    },

    async join(code) {
      try {
        const detail = await request<TableDetail>('/tables/join', { method: 'POST', body: { inviteCode: code.trim() } });
        set({ tables: putFirst(get().tables, detail.table), detail });
        showToast('Você entrou na mesa.', 'success');
        return detail;
      } catch (e) {
        showToast(mensagemDeErro(e), 'error');
        return null;
      }
    },

    async remove(id) {
      const ok = await attempt(async () => { await request<void>(`/tables/${id}`, { method: 'DELETE' }); }, 'Não foi possível excluir a mesa.');
      if (ok) { set((s) => ({ tables: s.tables.filter((t) => t.id !== id), detail: null })); showToast('Mesa excluída.', 'success'); }
      return ok;
    },

    async leave(id) {
      const ok = await attempt(async () => { await request<void>(`/tables/${id}/members/me`, { method: 'DELETE' }); }, 'Não foi possível sair da mesa.');
      if (ok) { set((s) => ({ tables: s.tables.filter((t) => t.id !== id), detail: null })); showToast('Você saiu da mesa.', 'success'); }
      return ok;
    },

    async removeMember(tableId, userId) {
      const ok = await attempt(async () => { await request<void>(`/tables/${tableId}/members/${userId}`, { method: 'DELETE' }); await reload(tableId); }, 'Não foi possível remover o jogador.');
      if (ok) showToast('Jogador removido da mesa.', 'success');
      return ok;
    },

    async regenerateInvite(tableId) {
      const ok = await attempt(async () => {
        const data = await request<{ inviteCode: string }>(`/tables/${tableId}/invite-code`, { method: 'POST' });
        set((s) => (s.detail ? { detail: { ...s.detail, inviteCode: data.inviteCode } } : {}));
      }, 'Não foi possível gerar um novo código.');
      if (ok) showToast('Novo código gerado. O anterior deixou de valer.', 'success');
    },

    async updateMyProfile(tableId, input) {
      let avatarUrl = get().detail?.me?.avatarUrl ?? undefined;
      if (input.avatar) {
        const uploaded = await uploadImage(input.avatar);
        if (!uploaded) { showToast('Não foi possível enviar o avatar. Tente de novo.', 'error'); return false; }
        avatarUrl = uploaded;
      }
      const ok = await attempt(async () => {
        await request<void>(`/tables/${tableId}/members/me`, {
          method: 'PATCH',
          body: { displayName: input.displayName.trim() || undefined, avatarUrl, muted: input.muted },
        });
        await reload(tableId);
      }, 'Não foi possível salvar o perfil da mesa.');
      if (ok) showToast('Perfil da mesa salvo.', 'success');
      return ok;
    },

    async changeRole(tableId, userId, role) {
      const ok = await attempt(async () => {
        await request<void>(`/tables/${tableId}/members/${userId}/role`, { method: 'PATCH', body: { role } });
        await reload(tableId);
      }, 'Não foi possível alterar o cargo.');
      if (ok) showToast(role === 'MODERATOR' ? 'Jogador promovido a moderador.' : 'Cargo alterado para jogador.', 'success');
      return ok;
    },

    async transferHost(tableId, userId) {
      const ok = await attempt(async () => {
        const data = await request<TableDetail>(`/tables/${tableId}/transfer-host`, { method: 'POST', body: { userId } });
        set((s) => ({ tables: s.tables.map((t) => (t.id === tableId ? data.table : t)), detail: data }));
      }, 'Não foi possível passar o cargo.');
      if (ok) showToast('Cargo de Mestre transferido.', 'success');
      return ok;
    },

    clear() { set({ tables: [], loading: false, loaded: false, failed: false, detail: null }); },
  };
});
