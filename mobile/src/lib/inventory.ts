import { request } from '../services/api';
import type { Coins, InventoryApiResponse, InventoryItem } from '../types';

export type ItemBody = Pick<InventoryItem, 'name' | 'category' | 'quantity' | 'weight'> & { damage?: string | null; description?: string | null };

const bodyOf = (i: ItemBody) => ({
  name: i.name, category: i.category, quantity: i.quantity, weight: i.weight, damage: i.damage ?? '', description: i.description ?? '',
});

export const fetchInventory = (characterId: string) => request<InventoryApiResponse>(`/characters/${characterId}/inventory`);
export const addItem = (characterId: string, item: ItemBody) =>
  request<InventoryItem>(`/characters/${characterId}/items`, { method: 'POST', body: bodyOf(item) });
export const saveItem = (characterId: string, itemId: string, item: ItemBody) =>
  request<InventoryItem>(`/characters/${characterId}/items/${itemId}`, { method: 'PUT', body: bodyOf(item) });
export const removeItem = (characterId: string, itemId: string) =>
  request<void>(`/characters/${characterId}/items/${itemId}`, { method: 'DELETE' });
export const saveCoins = (characterId: string, coins: Coins) =>
  request<Coins>(`/characters/${characterId}/coins`, { method: 'PUT', body: coins });

/** Carrying capacity in kg: Strength × 6.8 (same rule as the web sheet). */
export const capacityOf = (strength: number | undefined) => Math.round((strength ?? 10) * 6.8);
