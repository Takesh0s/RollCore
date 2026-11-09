# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). As versões seguem o
[SemVer](https://semver.org/lang/pt-BR/) e cada uma tem a tag `vX.Y.Z` na `main`.

## [1.2.0] - 2026-11-09

### Adicionado
- **Janelas de confirmação e de erro** no lugar dos avisos do navegador, com aviso de alterações não salvas
  ao sair de formulários e telas de "sem conexão" e "erro do servidor".
- **Conta e perfil:** trocar e-mail e senha (pedem a senha atual), excluir a conta e encerrar todas as sessões.
- **Gestão de mesa:** perfil na mesa (nome, avatar e silenciar), promover a moderador ou voltar a jogador,
  passar o cargo de Mestre com confirmação e aviso do limite de mesas do plano grátis.
- **Notificações:** central de notificações com filtros, resumo e "marcar todas como lidas", contador no sino
  e avisos de entrada e saída de membros, mudança de cargo, remoção, passagem de Mestre, mesa excluída e evento novo.
  Quem silenciou a mesa não recebe os avisos informativos dela.
- **Eventos:** página do evento (convidados, confirmados e resposta Vou / Talvez / Não vou) e aviso
  "Novo evento na mesa" no Início.
- API: `PUT /users/me/email`, `PUT /users/me/password`, `GET /notifications`, `POST /notifications/{id}/read`,
  `POST /notifications/read-all`; migrations V18 e V19.

### Corrigido
- A tela ficava vazia entre uma tela e outra (só o fundo e as ameias apareciam) por causa de um fade-out;
  a nova tela agora entra direto e há um loader discreto para carregamentos longos.

### Documentação
- Fluxo de trabalho Git Flow no `CONTRIBUTING.md` e documentação das rotas de conta e notificações em `docs/api/`.

## [1.1.0] - 2026-11-09

### Adicionado
- Calendário de sessões (mês, semana e dia) com criação de eventos e confirmação de presença, agora no servidor.
- Ações de mesa no web: excluir, sair, remover membro e entrar por código.
- Envio de imagens para o servidor (capas de mesa) e edição de mesa com migração das capas locais.

### Corrigido
- Capa da mesa no cartão da próxima sessão e ícone temático de Mesas no Início.

## [1.0.0]

Primeira versão marcada do projeto.
