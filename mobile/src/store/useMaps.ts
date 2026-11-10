import { create } from 'zustand';
import { mensagemDeErro, request } from '../services/api';
import type { GridType, MapKind } from '../lib/maps';

/** Mapa como a API devolve (`layers` é o JSON da pintura, em texto). */
export interface MapItem {
  id: string;
  name: string;
  kind: MapKind;
  gridType: GridType;
  cols: number;
  rows: number;
  cellSize: number;
  imageUrl: string | null;
  layers: string;
  gridVisible: boolean;
  fogEnabled: boolean;
  published: boolean;
  authorName: string;
  mine: boolean;
  updatedAt: string;
}

/** Corpo de criar/salvar; `imageId` é o id devolvido pelo envio da imagem. */
export interface MapBody {
  name: string;
  kind: MapKind;
  gridType: GridType;
  cols: number;
  rows: number;
  cellSize: number;
  imageId?: string | null;
  layers: string;
  gridVisible: boolean;
  fogEnabled: boolean;
}

export type MapResult = { ok: true; map: MapItem } | { ok: false; error: string };

/** `/images/{id}` → `{id}`. */
export const imageIdOf = (url: string | null | undefined) => (url ? url.split('/').pop() ?? null : null);

/** Corpo para salvar um mapa já existente, mudando só o que veio em `patch`. */
export const bodyOf = (m: MapItem, patch: Partial<MapBody> = {}): MapBody => ({
  name: m.name, kind: m.kind, gridType: m.gridType, cols: m.cols, rows: m.rows, cellSize: m.cellSize,
  imageId: imageIdOf(m.imageUrl), layers: m.layers, gridVisible: m.gridVisible, fogEnabled: m.fogEnabled,
  ...patch,
});

interface MapsState {
  maps: MapItem[];
  community: MapItem[];
  loading: boolean;
  loaded: boolean;
  failed: boolean;
  load: () => Promise<void>;
  loadCommunity: (q: string, kind: MapKind | '') => Promise<void>;
  get: (id: string) => Promise<MapItem | null>;
  create: (body: MapBody) => Promise<MapResult>;
  save: (id: string, body: MapBody) => Promise<MapResult>;
  remove: (id: string) => Promise<boolean>;
  setPublished: (id: string, published: boolean) => Promise<MapResult>;
  copy: (id: string) => Promise<MapResult>;
  clear: () => void;
}

const put = (list: MapItem[], next: MapItem) => (list.some((m) => m.id === next.id) ? list.map((m) => (m.id === next.id ? next : m)) : [next, ...list]);

/** Mapas do usuário e a Oficina da Comunidade, guardados no servidor. */
export const useMaps = create<MapsState>((set, get) => ({
  maps: [],
  community: [],
  loading: false,
  loaded: false,
  failed: false,

  async load() {
    set({ loading: true });
    try {
      const data = await request<MapItem[]>('/maps');
      set({ maps: data, loaded: true, failed: false });
    } catch {
      set({ failed: true });
    } finally {
      set({ loading: false });
    }
  },

  async loadCommunity(q, kind) {
    set({ loading: true });
    const qs = new URLSearchParams();
    if (q) qs.set('q', q);
    if (kind) qs.set('kind', kind);
    try {
      const data = await request<MapItem[]>(`/maps/community${qs.toString() ? `?${qs}` : ''}`);
      set({ community: data, failed: false });
    } catch {
      set({ failed: true });
    } finally {
      set({ loading: false });
    }
  },

  async get(id) {
    const known = get().maps.find((m) => m.id === id);
    if (known) return known;
    try {
      return await request<MapItem>(`/maps/${id}`);
    } catch {
      return null;
    }
  },

  async create(body) {
    try {
      const map = await request<MapItem>('/maps', { method: 'POST', body });
      set({ maps: put(get().maps, map) });
      return { ok: true, map };
    } catch (e) {
      return { ok: false, error: mensagemDeErro(e) };
    }
  },

  async save(id, body) {
    try {
      const map = await request<MapItem>(`/maps/${id}`, { method: 'PUT', body });
      set({ maps: put(get().maps, map) });
      return { ok: true, map };
    } catch (e) {
      return { ok: false, error: mensagemDeErro(e) };
    }
  },

  async remove(id) {
    try {
      await request<void>(`/maps/${id}`, { method: 'DELETE' });
      set({ maps: get().maps.filter((m) => m.id !== id) });
      return true;
    } catch {
      return false;
    }
  },

  async setPublished(id, published) {
    try {
      const map = await request<MapItem>(`/maps/${id}/${published ? 'publish' : 'unpublish'}`, { method: 'POST' });
      set({ maps: put(get().maps, map) });
      return { ok: true, map };
    } catch (e) {
      return { ok: false, error: mensagemDeErro(e) };
    }
  },

  async copy(id) {
    try {
      const map = await request<MapItem>(`/maps/${id}/copy`, { method: 'POST' });
      set({ maps: put(get().maps, map) });
      return { ok: true, map };
    } catch (e) {
      return { ok: false, error: mensagemDeErro(e) };
    }
  },

  clear() { set({ maps: [], community: [], loading: false, loaded: false, failed: false }); },
}));
