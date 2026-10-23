# API de Mesas (Fase 2a)

Todas as rotas exigem `Authorization: Bearer <accessToken>`. O usuário é sempre o dono do token;
nunca vai no corpo da requisição. Mesa que o usuário **não integra** responde **404** (não 403),
para não revelar IDs. Membro sem permissão para a ação recebe **403**.

Papéis (`role`): `MASTER` (GM, dono), `MODERATOR` ("Moderador assistente"), `PLAYER`.
`maxPlayers` conta **todos** os membros, inclusive o mestre.

| Tela do Figma | Rota | Quem pode |
|---|---|---|
| Criação de Mesa | `POST /tables` | qualquer usuário (vira `MASTER`) |
| Lista de Mesas | `GET /tables` | membro |
| Visão geral ao ingressar | `GET /tables/preview/{inviteCode}` | qualquer usuário |
| Ingressar Mesa | `POST /tables/join` | qualquer usuário |
| Detalhe / Perfil da Mesa | `GET /tables/{id}` | membro |
| Edição de Mesa | `PUT /tables/{id}` | `MASTER` |
| Excluir mesa | `DELETE /tables/{id}` | `MASTER` |
| Gerar novo código de convite | `POST /tables/{id}/invite-code` | `MASTER` |
| Perfil da Mesa (nome, avatar, silenciar) | `PATCH /tables/{id}/members/me` | membro |
| Sair da Mesa | `DELETE /tables/{id}/members/me` | membro (menos `MASTER`) |
| Remover membro | `DELETE /tables/{id}/members/{userId}` | `MASTER`, `MODERATOR` |
| Promover / rebaixar | `PATCH /tables/{id}/members/{userId}/role` | `MASTER` |

## Exemplos

`POST /tables`
```json
{ "name": "Em busca dos esquecidos", "gameSystem": "D&D 5e",
  "description": "Deuses perdidos...", "maxPlayers": 5, "coverUrl": "https://..." }
```
Campos opcionais: `gameSystem` (padrão `D&D 5e`), `description`, `maxPlayers` (padrão 5, de 1 a 20), `coverUrl` (http/https).
Resposta `201`:
```json
{ "table": { "id": "…", "name": "…", "gameSystem": "D&D 5e", "maxPlayers": 5, "playerCount": 1,
             "myRole": "MASTER", "ownerUsername": "luckydie", "createdAt": "…" },
  "inviteCode": "K7M2QX9R",
  "members": [ { "userId": "…", "username": "…", "displayName": null, "avatarUrl": null, "role": "MASTER", "joinedAt": "…" } ],
  "me": { "displayName": null, "avatarUrl": null, "muted": false, "role": "MASTER" } }
```
`inviteCode` só aparece para `MASTER` e `MODERATOR`.

`POST /tables/join` → `{ "inviteCode": "k7m2qx9r" }` (maiúsculas/minúsculas e espaços não importam).

`PATCH /tables/{id}/members/me` → só os campos enviados mudam; string vazia limpa o campo:
`{ "displayName": "Luckydie", "avatarUrl": "https://...", "muted": true }`

`PATCH /tables/{id}/members/{userId}/role` → `{ "role": "MODERATOR" }` (ou `PLAYER`).

## Erros

| Status | Quando |
|---|---|
| 400 | validação (nome com menos de 3 caracteres, `maxPlayers` fora de 1–20, capa que não é http/https, cargo inválido) |
| 403 | membro sem o papel necessário |
| 404 | mesa inexistente **ou** que você não integra; código de convite inválido |
| 409 | mesa cheia, já é membro, `maxPlayers` menor que o número atual de membros, mestre tentando sair, limite de mesas por usuário (10, configurável em `rollcore.tables.max-owned-per-user`) |

## Fora do escopo desta fase
- Upload de imagem (capa/avatar): por enquanto só URL.
- Sessão online com mapa em tempo real (WebSocket) e rolagens por mesa: Fase 2b.
- Calendário, comunidade/chat e notificações: Fases 3 e 4.
- "Usuário pagante" (telas de Criação de Mesa e Sistemas): regra de negócio ainda não definida.
