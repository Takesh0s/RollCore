# Conta e perfil

Todas as rotas abaixo exigem o token de acesso (`Authorization: Bearer ...`).

| Rota | Corpo | Resposta |
|---|---|---|
| `GET /users/me` | — | perfil, plano e cota de mesas |
| `PUT /users/me` | `{ username?, avatarUrl? }` | perfil atualizado (409 se o nome já existe) |
| `PUT /users/me/email` | `{ newEmail, currentPassword }` | perfil atualizado |
| `PUT /users/me/password` | `{ currentPassword, newPassword }` | novo par de tokens (`accessToken`, `refreshToken`) |
| `DELETE /auth/me` | — | confirmação; apaga a conta |
| `POST /auth/logout-all` | — | 204; encerra todas as sessões |

## Regras
- **E-mail e senha pedem a senha atual.** Senha errada responde **403**, e não 401: um 401 faria o
  cliente achar que a sessão expirou e tentar renovar o token.
- O e-mail é guardado em minúsculas e é único (409 se outra conta já o usa). Ainda não há verificação
  por link, porque o backend não envia e-mails.
- A nova senha segue a regra do cadastro (8+ caracteres, uma maiúscula e um número) e precisa ser
  diferente da atual (400).
- **Trocar a senha desconecta os outros aparelhos**: todos os refresh tokens são revogados e a resposta
  traz um par novo, para o aparelho que fez a troca continuar logado.
- As duas rotas que pedem a senha atual usam o mesmo limite de tentativas do login
  (`rate-limit.auth-requests-per-minute`, 10 por minuto por IP).
- `DELETE /auth/me` apaga também fichas, mesas, eventos e imagens da conta (cascata no banco). A
  confirmação digitando `EXCLUIR` é feita pelo app.
- Contas criadas só com o Google não têm uma senha que o usuário conheça: para elas, trocar e-mail ou
  senha só funcionará quando existir a recuperação de senha por e-mail.
