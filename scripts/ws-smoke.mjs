// Smoke test for the live table session (STOMP over WebSocket).
//
//   node scripts/ws-smoke.mjs <apiUrl> <accessToken> <tableId> [formula]
//
// Connects, subscribes to the table's rolls, presence and error topics, rolls once
// and prints every frame received for a few seconds. Needs Node 22+ (global WebSocket).

const [apiUrl, token, tableId, formula = '1d20'] = process.argv.slice(2);

if (!apiUrl || !token || !tableId) {
  console.error('Usage: node scripts/ws-smoke.mjs <apiUrl> <accessToken> <tableId> [formula]');
  process.exit(1);
}
if (typeof WebSocket === 'undefined') {
  console.error('This script needs Node 22 or newer (global WebSocket).');
  process.exit(1);
}

const wsUrl = apiUrl.replace(/\/+$/, '').replace(/^http/, 'ws') + '/ws';
const NUL = '\0';

const frame = (command, headers = {}, body = '') =>
  command + '\n' + Object.entries(headers).map(([k, v]) => `${k}:${v}`).join('\n') + '\n\n' + body + NUL;

function parse(raw) {
  const [head, ...rest] = raw.split('\n\n');
  const [command, ...headerLines] = head.split('\n');
  const headers = Object.fromEntries(headerLines.map((l) => [l.slice(0, l.indexOf(':')), l.slice(l.indexOf(':') + 1)]));
  return { command, headers, body: rest.join('\n\n') };
}

const ws = new WebSocket(wsUrl);
let rolled = false;

ws.onopen = () => {
  console.log('> connecting to', wsUrl);
  ws.send(frame('CONNECT', { 'accept-version': '1.2', 'heart-beat': '0,0', Authorization: `Bearer ${token}` }));
};

ws.onmessage = (event) => {
  for (const raw of String(event.data).split(NUL).map((s) => s.replace(/^\n+/, '')).filter(Boolean)) {
    const f = parse(raw);
    if (f.command === 'CONNECTED') {
      console.log('< CONNECTED');
      ws.send(frame('SUBSCRIBE', { id: 'sub-rolls', destination: `/topic/tables/${tableId}/rolls` }));
      ws.send(frame('SUBSCRIBE', { id: 'sub-presence', destination: `/topic/tables/${tableId}/presence` }));
      ws.send(frame('SUBSCRIBE', { id: 'sub-errors', destination: '/user/queue/errors' }));
      setTimeout(() => {
        if (rolled) return;
        rolled = true;
        console.log(`> rolling ${formula}`);
        ws.send(frame('SEND', { destination: `/app/tables/${tableId}/roll`, 'content-type': 'application/json' },
          JSON.stringify({ formula })));
      }, 800);
    } else if (f.command === 'MESSAGE') {
      console.log(`< ${f.headers.destination}\n  ${f.body}`);
    } else if (f.command === 'ERROR') {
      console.log('< ERROR', f.headers.message ?? '', f.body);
    }
  }
};

ws.onerror = () => console.log('! socket error');
ws.onclose = (e) => { console.log(`closed (${e.code})`); process.exit(0); };

setTimeout(() => { console.log('done'); ws.close(); }, 5000);
