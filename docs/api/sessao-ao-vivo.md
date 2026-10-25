# Sessão ao vivo

Uma mesa pode ser usada em tempo real: as rolagens feitas por um membro chegam na hora aos outros membros conectados, e todos veem quem está online. O canal é STOMP sobre WebSocket; as mesmas ações existem em HTTP para quem não mantém um socket aberto.

Só membros da mesa participam. Quem não é membro recebe o mesmo `404` de uma mesa que não existe.

## Conexão

| Item | Valor |
| --- | --- |
| Endpoint | `ws://localhost:8080/ws` (`wss://` em produção) |
| Protocolo | STOMP 1.2 sobre WebSocket puro (sem SockJS) |
| Autenticação | Cabeçalho `Authorization: Bearer <accessToken>` no frame `CONNECT` |
| Heart-beat | 10 s nos dois sentidos |

O upgrade do WebSocket é público porque navegadores não conseguem enviar cabeçalhos nele. A autenticação acontece no frame `CONNECT`; sem token válido a conexão é encerrada com um frame `ERROR`.

## Canais

| Direção | Destino | Conteúdo |
| --- | --- | --- |
| Cliente → API | `SEND /app/tables/{tableId}/roll` | `{"formula":"2d6+3"}` |
| API → membros | `SUBSCRIBE /topic/tables/{tableId}/rolls` | rolagem feita na mesa (`TableRollEvent`) |
| API → membros | `SUBSCRIBE /topic/tables/{tableId}/presence` | quem está online (`PresenceEvent`) |
| API → o remetente | `SUBSCRIBE /user/queue/errors` | erro da última mensagem (`ErrorEvent`) |

Qualquer outro destino é recusado. Assinar `rolls` ou `presence` exige ser membro da mesa. Um usuário conta como online enquanto tiver a assinatura de `presence` aberta, em qualquer dispositivo.

### TableRollEvent

```json
{
  "id": "uuid",
  "userId": "uuid",
  "username": "ana",
  "displayName": "Aelar",
  "formula": "2d6+3",
  "rolls": [4, 2],
  "mod": 3,
  "total": 9,
  "rolledAt": "2026-10-25T04:06:36.868475Z"
}
```

`displayName` é o nome do perfil da mesa, ou o `username` quando não há um.

### PresenceEvent

```json
{ "tableId": "uuid", "online": [ { "userId": "uuid", "username": "ana" } ] }
```

### ErrorEvent

```json
{ "code": "INVALID_FORMULA", "message": "Fórmula inválida: ..." }
```

Códigos: `INVALID_FORMULA`, `NOT_FOUND`, `ERROR`.

## HTTP

Mesmas regras de acesso; exigem `Authorization: Bearer`.

| Rota | Descrição |
| --- | --- |
| `POST /tables/{id}/rolls` | Rola na mesa (`{"formula":"1d20"}`), responde `201` com o `TableRollEvent` e também envia para quem está assinando. |
| `GET /tables/{id}/rolls?limit=50` | Últimas rolagens da mesa, mais novas primeiro. `limit` de 1 a 100. |
| `GET /tables/{id}/presence` | Quem está conectado agora. |

A rolagem é sempre feita no servidor com `SecureRandom`, e o evento só é enviado depois de gravada no banco.

## Testando

Com a API rodando e um usuário que seja membro da mesa:

```powershell
$api = "http://localhost:8080"
node scripts/ws-smoke.mjs $api "<accessToken>" "<tableId>" "2d6+3"
```

O script conecta, assina os três destinos, rola uma vez e imprime o que chega por 5 segundos. Para ver a transmissão entre duas pessoas, rode em um terminal e faça `POST /tables/{id}/rolls` em outro.

## Limites desta versão

- **Uma instância da API.** A presença fica em memória e o broker é o simples do Spring. Com várias instâncias seria preciso um broker externo (por exemplo, Redis ou RabbitMQ).
- **Hibernação do Render.** No plano gratuito a instância dorme depois de um tempo ocioso e derruba os sockets; o cliente precisa reconectar e assinar de novo.
- **Quem sai da mesa.** Quem é removido de uma mesa ou sai dela continua assinando os canais até a conexão cair; novas rolagens dessa pessoa já são recusadas. O cliente deve reconectar ao mudar de mesa.
- **Token.** O access token só é conferido no `CONNECT`; uma conexão aberta continua valendo depois dele expirar.

## Migração

`V10__table_rolls.sql` adiciona `dice_rolls.game_table_id` (nulo para rolagens avulsas) e um índice por mesa e data.
