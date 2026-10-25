// Live table session: connects to the table's STOMP channels and exposes the roll
// feed, who is online and a `rolar` action to the screen.

import { useCallback, useEffect, useRef, useState } from 'react';
import { currentAccessToken, renewAccessToken, request } from './api';
import { API_URL } from './config';
import { StompClient, type StompStatus } from './stomp';

export interface RolagemAoVivo {
  id: string;
  userId: string;
  username: string;
  displayName: string | null;
  formula: string;
  rolls: number[];
  mod: number;
  total: number;
  rolledAt: string;
}

export interface MembroOnline {
  userId: string;
  username: string;
}

const HISTORY_LIMIT = 30;
const MAX_KEPT = 100;

export function websocketUrl(): string {
  return `${API_URL.replace(/^http/i, 'ws')}/ws`;
}

function parse<T>(body: string): T | null {
  try { return JSON.parse(body) as T; } catch { return null; }
}

export function useSessaoAoVivo(mesaId: string | undefined) {
  const [status, setStatus] = useState<StompStatus>('closed');
  const [rolagens, setRolagens] = useState<RolagemAoVivo[]>([]);
  const [online, setOnline] = useState<MembroOnline[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const clientRef = useRef<StompClient | null>(null);

  useEffect(() => {
    if (!mesaId) return undefined;

    const client = new StompClient({
      url: websocketUrl(),
      getToken: (renew) => (renew ? renewAccessToken() : currentAccessToken()),
    });
    clientRef.current = client;
    let active = true;

    const offStatus = client.onStatus((s) => {
      if (!active) return;
      setStatus(s);
      if (s === 'connected') {
        setErro(null);
        // Catch up on what was rolled while we were away.
        request<RolagemAoVivo[]>(`/tables/${mesaId}/rolls?limit=${HISTORY_LIMIT}`)
          .then((history) => {
            if (!active) return;
            setRolagens((current) => {
              const seen = new Set(current.map((r) => r.id));
              return [...current, ...history.filter((r) => !seen.has(r.id))]
                .sort((a, b) => b.rolledAt.localeCompare(a.rolledAt))
                .slice(0, MAX_KEPT);
            });
          })
          .catch(() => undefined);
      }
    });

    const offRolls = client.subscribe(`/topic/tables/${mesaId}/rolls`, (body) => {
      const roll = parse<RolagemAoVivo>(body);
      if (!roll || !active) return;
      setRolagens((current) =>
        current.some((r) => r.id === roll.id) ? current : [roll, ...current].slice(0, MAX_KEPT));
    });

    const offPresence = client.subscribe(`/topic/tables/${mesaId}/presence`, (body) => {
      const event = parse<{ online: MembroOnline[] }>(body);
      if (event && active) setOnline(event.online ?? []);
    });

    const offErrors = client.subscribe('/user/queue/errors', (body) => {
      const event = parse<{ message?: string }>(body);
      if (active) setErro(event?.message ?? 'Não foi possível rolar.');
    });

    client.connect();

    return () => {
      active = false;
      offStatus(); offRolls(); offPresence(); offErrors();
      client.disconnect();
      clientRef.current = null;
    };
  }, [mesaId]);

  const rolar = useCallback((formula: string): boolean => {
    const text = formula.trim();
    if (!mesaId || !text) return false;
    setErro(null);
    const sent = clientRef.current?.send(`/app/tables/${mesaId}/roll`, JSON.stringify({ formula: text })) ?? false;
    if (!sent) setErro('Sem conexão com a mesa. Tentando reconectar…');
    return sent;
  }, [mesaId]);

  return { status, rolagens, online, erro, rolar };
}
