// Minimal STOMP 1.2 client over WebSocket.
//
// Just what the live table session needs: CONNECT with a bearer token, SUBSCRIBE,
// SEND, heart-beats and automatic reconnection. Subscriptions are remembered and
// re-sent after every reconnection. It only uses the global WebSocket, so it runs on
// React Native, the browser and Node 22+.

const NUL = '\0';

export type StompStatus = 'connecting' | 'connected' | 'reconnecting' | 'closed';

export interface StompOptions {
  url: string;
  /** Returns the access token. `renew` is true after the server rejected the previous one. */
  getToken: (renew: boolean) => Promise<string | null>;
  /** Heart-beat interval in ms (both directions). Default 10 000. */
  heartbeatMs?: number;
  /** Reconnection delays grow from `minDelayMs` up to `maxDelayMs`. */
  minDelayMs?: number;
  maxDelayMs?: number;
}

interface Frame {
  command: string;
  headers: Record<string, string>;
  body: string;
}

type MessageHandler = (body: string) => void;

interface Subscription {
  id: string;
  destination: string;
  handler: MessageHandler;
}

export function encodeFrame(command: string, headers: Record<string, string> = {}, body = ''): string {
  const lines = Object.entries(headers).map(([k, v]) => `${k}:${v}`);
  return `${command}\n${lines.join('\n')}${lines.length ? '\n' : ''}\n${body}${NUL}`;
}

/** Splits received data into frames, ignoring heart-beat newlines between them. */
export function decodeFrames(data: string): Frame[] {
  const frames: Frame[] = [];
  for (const raw of data.split(NUL)) {
    const text = raw.replace(/^[\r\n]+/, '');
    if (!text) continue;
    const separator = text.indexOf('\n\n');
    const head = separator === -1 ? text : text.slice(0, separator);
    const body = separator === -1 ? '' : text.slice(separator + 2);
    const [command, ...headerLines] = head.split('\n');
    const headers: Record<string, string> = {};
    for (const line of headerLines) {
      const colon = line.indexOf(':');
      if (colon > 0) headers[line.slice(0, colon)] = line.slice(colon + 1).replace(/\r$/, '');
    }
    frames.push({ command: command.trim(), headers, body });
  }
  return frames;
}

export class StompClient {
  private ws: WebSocket | null = null;
  private status: StompStatus = 'closed';
  private wantConnected = false;
  private renewToken = false;
  private attempts = 0;
  private nextId = 0;
  private subscriptions = new Map<string, Subscription>();
  private statusListeners = new Set<(status: StompStatus) => void>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private watchdog: ReturnType<typeof setInterval> | null = null;
  private lastActivity = 0;

  constructor(private readonly options: StompOptions) {}

  get currentStatus(): StompStatus { return this.status; }

  onStatus(listener: (status: StompStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => { this.statusListeners.delete(listener); };
  }

  connect(): void {
    if (this.wantConnected) return;
    this.wantConnected = true;
    this.attempts = 0;
    this.open();
  }

  disconnect(): void {
    this.wantConnected = false;
    this.clearTimers();
    const ws = this.ws;
    this.ws = null;
    if (ws) {
      try { ws.send(encodeFrame('DISCONNECT')); } catch { /* socket already gone */ }
      detach(ws);
      try { ws.close(); } catch { /* ignore */ }
    }
    this.setStatus('closed');
  }

  /** Subscribes now (when connected) and again after every reconnection. */
  subscribe(destination: string, handler: MessageHandler): () => void {
    const id = `sub-${this.nextId++}`;
    this.subscriptions.set(id, { id, destination, handler });
    if (this.status === 'connected') this.sendSubscribe(id, destination);
    return () => {
      if (!this.subscriptions.delete(id)) return;
      if (this.status === 'connected') this.write(encodeFrame('UNSUBSCRIBE', { id }));
    };
  }

  /** Returns false when the message could not be sent (not connected). */
  send(destination: string, body: string): boolean {
    if (this.status !== 'connected') return false;
    return this.write(encodeFrame('SEND', { destination, 'content-type': 'application/json' }, body));
  }

  // ── Connection ──────────────────────────────────────────────────────────────

  private open(): void {
    this.setStatus(this.attempts === 0 ? 'connecting' : 'reconnecting');

    this.options.getToken(this.renewToken).then((token) => {
      if (!this.wantConnected) return;
      if (!token) {
        this.wantConnected = false;
        this.setStatus('closed');
        return;
      }
      this.renewToken = false;

      let ws: WebSocket;
      try {
        ws = new WebSocket(this.options.url);
      } catch {
        this.scheduleReconnect();
        return;
      }
      this.ws = ws;

      const heartbeat = this.options.heartbeatMs ?? 10_000;

      ws.onopen = () => {
        this.write(encodeFrame('CONNECT', {
          'accept-version': '1.2',
          'heart-beat': `${heartbeat},${heartbeat}`,
          Authorization: `Bearer ${token}`,
        }));
      };

      ws.onmessage = (event: { data: unknown }) => {
        this.lastActivity = Date.now();
        if (typeof event.data !== 'string') return;
        for (const frame of decodeFrames(event.data)) this.handleFrame(frame, heartbeat);
      };

      ws.onerror = () => { /* onclose follows and handles the retry */ };

      ws.onclose = () => {
        if (this.ws !== ws) return;
        this.ws = null;
        this.clearTimers();
        if (this.wantConnected) this.scheduleReconnect();
      };
    }).catch(() => {
      if (this.wantConnected) this.scheduleReconnect();
    });
  }

  private handleFrame(frame: Frame, heartbeat: number): void {
    switch (frame.command) {
      case 'CONNECTED':
        this.attempts = 0;
        this.setStatus('connected');
        this.startTimers(heartbeat);
        this.subscriptions.forEach((s) => this.sendSubscribe(s.id, s.destination));
        break;
      case 'MESSAGE': {
        const sub = this.subscriptions.get(frame.headers.subscription ?? '');
        if (sub) {
          try { sub.handler(frame.body); } catch { /* a faulty handler must not kill the socket */ }
        }
        break;
      }
      case 'ERROR':
        // Most likely an expired token: ask for a fresh one on the next attempt.
        this.renewToken = true;
        try { this.ws?.close(); } catch { /* onclose will reconnect */ }
        break;
      default:
        break;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || !this.wantConnected) return;
    const min = this.options.minDelayMs ?? 1_000;
    const max = this.options.maxDelayMs ?? 15_000;
    const delay = Math.min(max, min * 2 ** this.attempts);
    this.attempts += 1;
    this.setStatus('reconnecting');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.wantConnected) this.open();
    }, delay);
  }

  private startTimers(heartbeat: number): void {
    this.clearTimers();
    this.lastActivity = Date.now();
    this.pingTimer = setInterval(() => { this.write('\n'); }, heartbeat);
    // No traffic (not even a heart-beat) for three intervals: the link is dead.
    this.watchdog = setInterval(() => {
      if (Date.now() - this.lastActivity > heartbeat * 3) {
        try { this.ws?.close(); } catch { /* ignore */ }
      }
    }, heartbeat);
  }

  private clearTimers(): void {
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    if (this.pingTimer) { clearInterval(this.pingTimer); this.pingTimer = null; }
    if (this.watchdog) { clearInterval(this.watchdog); this.watchdog = null; }
  }

  private sendSubscribe(id: string, destination: string): void {
    this.write(encodeFrame('SUBSCRIBE', { id, destination }));
  }

  private write(data: string): boolean {
    try {
      this.ws?.send(data);
      return this.ws !== null;
    } catch {
      return false;
    }
  }

  private setStatus(status: StompStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }
}

function detach(ws: WebSocket): void {
  ws.onopen = null;
  ws.onmessage = null;
  ws.onerror = null;
  ws.onclose = null;
}
