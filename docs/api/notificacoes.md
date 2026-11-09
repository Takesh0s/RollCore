# Notificações

Todas as rotas exigem o token de acesso (`Authorization: Bearer ...`).

| Rota | Resposta |
|---|---|
| `GET /notifications` | `{ items: [...], unread }`: as 50 mais recentes e o total de não lidas |
| `POST /notifications/{id}/read` | 204; 404 se a notificação não for sua |
| `POST /notifications/read-all` | 204 |

Cada item traz `id`, `type`, `tableId`, `tableName`, `actorName`, `detail`, `read` e `createdAt`.
O texto é montado pelo cliente a partir do `type`.

## Quando uma notificação é criada
| `type` | Quem recebe | `detail` |
|---|---|---|
| `MEMBER_JOINED` | mestre e moderadores | — |
| `MEMBER_LEFT` | mestre | — |
| `ROLE_CHANGED` | quem teve o cargo alterado | novo cargo |
| `REMOVED_FROM_TABLE` | quem foi removido | — |
| `HOST_TRANSFERRED` | o novo mestre | — |
| `TABLE_DELETED` | todos os membros, menos o mestre que excluiu | — |
| `EVENT_CREATED` | membros, menos quem agendou | título do evento |

## Regras
- Quem silenciou a mesa (Perfil da mesa) **não** recebe `MEMBER_JOINED`, `MEMBER_LEFT` nem `EVENT_CREATED`
  dessa mesa. Mudanças de acesso (remoção, mesa excluída, passagem de cargo, mudança de cargo) sempre chegam.
- `tableId` fica vazio quando o destinatário já não pode abrir a mesa (`REMOVED_FROM_TABLE`, `TABLE_DELETED`).
- A tabela não tem chave estrangeira para a mesa de propósito: a notificação continua existindo depois que a
  mesa é excluída.
- Notificações com mais de 30 dias são apagadas todo dia às 03:40.
