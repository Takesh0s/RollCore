# Planos e cota de mesas (Fase 2c)

| | Grátis (`FREE`) | Pagante (`PREMIUM`) |
|---|---|---|
| Mesas que paga ao mesmo tempo | 1 | ilimitadas na prática (teto técnico: 200) |
| Passar o hosting (mestre) a outro membro | não | sim |
| Sistemas próprios, Livraria, perfil personalizado | — | fases seguintes |

Quem **paga** a mesa é o *patrocinador* (`sponsor`): normalmente quem a criou. Ao passar o hosting, o
novo mestre assume o controle e o antigo mestre vira *moderador assistente*, mas a mesa continua
contando na cota do patrocinador, e não na de quem hospeda. Para criar outra mesa no plano grátis,
exclua a atual.

## Rotas
- `GET /users/me` → `{ userId, username, email, plan, tablesUsed, tablesLimit }` (`tablesLimit` é `null` no plano pagante).
- `POST /tables/{id}/transfer-host` com `{ "userId": "<novo mestre>" }` → detalhe da mesa. Só o patrocinador, e só no
  plano pagante (403 caso contrário); o alvo precisa ser membro (404) e não pode já ser o mestre (409).
- O detalhe da mesa traz `canTransferHost`, para a tela saber se mostra o botão.

## Ligar o plano pagante (ainda sem pagamento)
Não existe rota para o usuário se promover sozinho de propósito. Enquanto não há cobrança, no banco:

```sql
UPDATE users SET plan = 'PREMIUM' WHERE email = 'pessoa@exemplo.com';
```

Quando houver gateway de pagamento, ele passa a alterar `users.plan`.
