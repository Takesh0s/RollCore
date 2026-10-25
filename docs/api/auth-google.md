# Login com Google

O RollCore aceita entrar (ou criar conta) com uma conta Google. O login continua sendo da própria API: o Google só prova quem é a pessoa, e a API devolve o mesmo par de tokens JWT usado no login por e-mail e senha.

## Fluxo

1. O cliente abre o login do Google (Google Identity Services) e recebe um **ID token**.
2. O cliente envia o token para `POST /auth/google`.
3. A API valida o token e aplica as regras abaixo.
4. A resposta é igual à de `/auth/login`: `accessToken`, `refreshToken`, `userId`, `email`, `username`.

## Endpoint

`POST /auth/google` (público, sujeito ao rate limit estrito de autenticação)

```json
{ "idToken": "<ID token emitido pelo Google>" }
```

| Status | Quando |
| --- | --- |
| `200` | Token válido. Conta existente ou criada agora. |
| `400` | `idToken` ausente, vazio ou maior que 4096 caracteres. |
| `401` | Token inválido, expirado, de outro aplicativo, e-mail não verificado, ou e-mail já vinculado a outra conta Google. |
| `429` | Limite de requisições de autenticação atingido. |

## Regras de conta

- **`sub` do Google já conhecido:** entra na conta vinculada.
- **E-mail igual ao de uma conta com senha:** o Google é vinculado a essa conta (o Google garante que o e-mail foi verificado). A senha continua funcionando.
- **Primeiro acesso:** cria a conta. O `username` é derivado da parte local do e-mail (apenas `[a-zA-Z0-9_]`, 3 a 20 caracteres, com sufixo numérico se já existir). A senha é um valor aleatório descartado, então a conta só entra pelo Google até que uma recuperação de senha exista.
- **E-mail já vinculado a outro `sub`:** recusado com `401`.

## Validação do token

A API consulta o endpoint `tokeninfo` do Google, que confere a assinatura e a expiração, e então exige:

- `aud` igual a um dos client ids configurados;
- `iss` igual a `accounts.google.com` ou `https://accounts.google.com`;
- `email_verified` verdadeiro;
- `exp` no futuro.

Sem `GOOGLE_CLIENT_ID` configurado, todos os tokens são recusados (recurso desligado).

## Configuração

| Onde | Variável | Valor |
| --- | --- | --- |
| Backend (Render, Compose) | `GOOGLE_CLIENT_ID` | Client id do tipo "Aplicativo da Web". Aceita vários, separados por vírgula (por exemplo, web e Android). |
| Web (Vercel, `.env`) | `VITE_GOOGLE_CLIENT_ID` | O mesmo client id. Sem ele, o botão não aparece. |

O client id é público. O *client secret* não é usado neste fluxo e não deve ser colocado no projeto.

No Google Cloud Console, o client id deve ter como **origens JavaScript autorizadas** `http://localhost:5173` e o domínio do web em produção.

## Migração

`V9__google_login.sql` adiciona `users.google_sub` (único, aceita nulo).
