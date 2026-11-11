import type { AppNotification } from '../store/useNotifications';

const ROLE_WORD: Record<string, string> = { MODERATOR: 'moderador', PLAYER: 'jogador', MASTER: 'Mestre' };

/** A frase em partes: `bold` marca os trechos em destaque (quem fez e a mesa). */
export type Part = { text: string; bold?: boolean };

export function notificationParts(n: AppNotification): Part[] {
  const who: Part = { text: n.actorName ?? 'Alguém', bold: true };
  const table: Part = { text: n.tableName ?? 'uma mesa', bold: true };
  switch (n.type) {
    case 'MEMBER_JOINED': return [who, { text: ' entrou na mesa ' }, table, { text: '.' }];
    case 'MEMBER_LEFT': return [who, { text: ' saiu da mesa ' }, table, { text: '.' }];
    case 'ROLE_CHANGED': return [who, { text: ' mudou seu cargo em ' }, table, { text: ` para ${ROLE_WORD[n.detail ?? ''] ?? 'outro cargo'}.` }];
    case 'REMOVED_FROM_TABLE': return [{ text: 'Você foi removido da mesa ' }, table, { text: '.' }];
    case 'HOST_TRANSFERRED': return [who, { text: ' passou o cargo de Mestre de ' }, table, { text: ' para você.' }];
    case 'TABLE_DELETED': return [who, { text: ' excluiu a mesa ' }, table, { text: '.' }];
    case 'EVENT_CREATED': return [who, { text: ' agendou ' }, { text: n.detail ?? 'um evento', bold: true }, { text: ' em ' }, table, { text: '.' }];
    default: return [{ text: 'Nova notificação.' }];
  }
}

export const isEventNotification = (n: AppNotification) => n.type === 'EVENT_CREATED';
export const canOpenNotification = (n: AppNotification) => n.type === 'EVENT_CREATED' || !!n.tableId;

const pad = (n: number) => String(n).padStart(2, '0');

export function relativeTime(iso: string, now = Date.now()): string {
  const d = new Date(iso);
  const min = Math.round((now - d.getTime()) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function dayGroup(iso: string, now = new Date()): 'Hoje' | 'Ontem' | 'Anteriores' {
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((start(now) - start(new Date(iso))) / 86400000);
  return days <= 0 ? 'Hoje' : days === 1 ? 'Ontem' : 'Anteriores';
}
