# RollCore

Plataforma de RPG de mesa (foco em D&D 5e) com ficha de personagem, rolagem de dados, grimório de magias e gerenciamento de mesas. O projeto é composto por uma API REST, um cliente web e um aplicativo mobile que compartilham o mesmo backend.

Projeto de Trabalho de Conclusão de Curso (Engenharia de Software, UCB).

![CI](https://github.com/Takesh0s/RollCore/actions/workflows/ci.yml/badge.svg)
![Frontend](https://github.com/Takesh0s/RollCore/actions/workflows/frontend.yml/badge.svg)
![Java](https://img.shields.io/badge/Java-21-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.5-6DB33F)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)

## Sumário

- [Visão geral](#visão-geral)
- [Status](#status)
- [Arquitetura](#arquitetura)
- [Stack](#stack)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Como executar](#como-executar)
- [Configuração](#configuração)
- [API](#api)
- [Testes](#testes)
- [Deploy](#deploy)
- [Roadmap](#roadmap)
- [Documentação](#documentação)
- [Equipe](#equipe)
- [Licença](#licença)

## Visão geral

O RollCore reúne em um único lugar o que um grupo de RPG de mesa usa durante a campanha:

- **Personagens:** criação e edição de fichas de D&D 5e, com cálculo de modificadores, bônus de proficiência e pontos de vida feito no servidor.
- **Dados:** rolagens com notação padrão (por exemplo `2d6+3`), vantagem/desvantagem e histórico persistido.
- **Magias:** consulta ao catálogo SRD e associação de magias às fichas.
- **Mesas:** criação de mesas, convite por código, papéis (mestre, moderador, jogador) e transferência da função de anfitrião.
- **Contas:** cadastro, login com JWT de curta duração, renovação por refresh token e planos `FREE` e `PREMIUM`.

## Status

| Área | Situação |
| --- | --- |
| Autenticação (JWT + refresh token com rotação) | Implementado |
| Personagens, magias e dados | Implementado |
| Mesas, convites, papéis e planos | Implementado |
| Cliente web (personagens, dados, dashboard) | Implementado |
| Aplicativo mobile integrado à API (login, cadastro, mesas) | Implementado |
| Sessão ao vivo (WebSocket) | Planejado |
| Biblioteca de sistemas e bestiário | Planejado |
| Chat, calendário e notificações | Planejado |
| Recuperação de senha por e-mail | Planejado |
| Pagamento do plano `PREMIUM` | Planejado |

## Arquitetura

```
┌──────────────┐   ┌──────────────┐
│  Web (Vite)  │   │ Mobile (Expo)│
│  React + TS  │   │ React Native │
└──────┬───────┘   └──────┬───────┘
       │   HTTPS / JSON   │
       └────────┬─────────┘
                ▼
     ┌─────────────────────┐
     │  API Spring Boot    │
     │  filtros: CORS →    │
     │  rate limit → JWT   │
     ├─────────────────────┤
     │ Controller          │
     │ Service             │
     │ Repository (JPA)    │
     └──────────┬──────────┘
                ▼
     ┌─────────────────────┐
     │  PostgreSQL 16      │
     │  esquema via Flyway │
     └─────────────────────┘
```

Decisões principais:

- **Camadas:** `controller` expõe HTTP e valida entrada; `service` concentra regras de negócio e transações; `repository` isola o acesso a dados. Entidades JPA não saem da API, que responde com DTOs.
- **Stateless:** a API não mantém sessão. O access token dura 15 minutos e o refresh token 7 dias.
- **Refresh tokens:** guardados apenas como hash SHA-256, com rotação a cada uso e detecção de reutilização por família de tokens (uma reutilização revoga a família inteira). Há uma janela curta de tolerância para requisições concorrentes.
- **Esquema versionado:** o Hibernate roda em `ddl-auto: validate`; toda mudança de banco passa por uma migração Flyway (`V1` a `V8`).
- **Isolamento de recursos:** quem não é membro de uma mesa recebe `404`, não `403`, para não revelar que ela existe. A entrada em mesas usa lock pessimista na linha para respeitar o limite de membros sob concorrência.
- **Planos:** o limite de mesas é aplicado por patrocinador (`sponsor_id`), de forma que a hospedagem de uma mesa pode ser transferida sem burlar a cota.
- **Rate limiting:** Bucket4j, com limite mais restrito nas rotas de autenticação.

## Stack

**Backend**
- Java 21, Spring Boot 3.2.5 (Web, Security, Data JPA, Validation, Actuator)
- PostgreSQL 16, Flyway 9
- JWT, Bucket4j, springdoc-openapi
- JUnit 5, Mockito, Spring Test, JaCoCo

**Web (`web/`)**
- React 18, TypeScript, Vite 5
- Zustand, Axios
- Playwright (E2E)

**Mobile (`mobile/`)**
- Expo SDK 57, React Native, expo-router
- expo-secure-store (tokens), AsyncStorage
- EAS Build (APK Android)

**Infraestrutura**
- Docker e Docker Compose
- GitHub Actions (build, testes, cobertura, imagem no GHCR)
- Render (API), Supabase (PostgreSQL), Vercel (web)

## Estrutura do repositório

```
.
├── backend/            API Spring Boot
│   └── src/main/java/com/rollcore/
│       ├── config/       segurança, CORS, OpenAPI
│       ├── controller/   endpoints REST
│       ├── dto/          objetos de requisição e resposta
│       ├── entity/       entidades JPA
│       ├── exception/    tratamento centralizado de erros
│       ├── filter/       JWT e rate limit
│       ├── repository/   Spring Data
│       ├── security/     emissão e validação de tokens
│       └── service/      regras de negócio
├── web/                cliente web (React + Vite) e testes E2E
├── mobile/             aplicativo (Expo)
├── docs/               API, arquitetura, requisitos, testes, UI
├── .github/workflows/  CI
├── docker-compose.yml  ambiente local (API + PostgreSQL)
├── render.yaml         blueprint de deploy
└── RollCore.postman_collection.json
```

## Como executar

### Pré-requisitos

- Docker e Docker Compose
- Node.js LTS
- JDK 21 (apenas para rodar os testes do backend fora do Docker)

### Backend

```bash
docker compose up -d --build
```

A API sobe em `http://localhost:8080` com PostgreSQL local e migrações aplicadas automaticamente.

- Health check: `http://localhost:8080/actuator/health`
- Swagger UI: `http://localhost:8080/swagger-ui.html`

Se o build via Compose falhar por restrições do buildx, construa a imagem diretamente e recrie o serviço:

```bash
docker build -t rollcore-api ./backend
docker compose up -d --force-recreate api
```

### Web

```bash
cd web
npm install
npm run dev
```

Disponível em `http://localhost:5173`.

### Mobile

```bash
cd mobile
npm install
cp .env.example .env     # defina EXPO_PUBLIC_API_URL
npx expo start
```

`EXPO_PUBLIC_API_URL` deve apontar para a API. Em emulador Android use `http://10.0.2.2:8080`; em dispositivo físico, o IP da máquina na rede local ou uma URL HTTPS pública. Para gerar o APK:

```bash
cd mobile
npx eas build --platform android --profile preview
```

## Configuração

Variáveis de ambiente do backend:

| Variável | Descrição | Padrão |
| --- | --- | --- |
| `SPRING_DATASOURCE_URL` | URL JDBC do PostgreSQL | `jdbc:postgresql://localhost:5432/rollcore` |
| `SPRING_DATASOURCE_USERNAME` | Usuário do banco | `rollcore` |
| `SPRING_DATASOURCE_PASSWORD` | Senha do banco | `rollcore` |
| `JWT_SECRET` | Segredo de assinatura (mínimo 32 bytes) | **obrigatório**, sem padrão |
| `CORS_ORIGINS` | Origens permitidas, separadas por vírgula | origens locais e Vercel |
| `PORT` | Porta HTTP | `8080` |
| `RATE_LIMIT_RPM` | Requisições por minuto por cliente | `60` |
| `RATE_LIMIT_AUTH_RPM` | Requisições por minuto nas rotas de autenticação | `10` |
| `E2E_CLEANUP_ENABLED` | Habilita `DELETE /auth/deleteall` (somente testes) | `false` |

A aplicação se recusa a iniciar sem um `JWT_SECRET` forte. O `docker-compose.yml` usa um segredo de desenvolvimento que **não deve** ser reaproveitado em produção. Nunca versione arquivos `.env`.

## API

Visão geral dos grupos de rotas (detalhes e esquemas no Swagger UI):

| Grupo | Rotas |
| --- | --- |
| Autenticação | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/logout-all`; `DELETE /auth/me` |
| Usuário | `GET /users/me` |
| Personagens | CRUD em `/characters` e sub-rotas de magias |
| Magias | `GET /spells`, `GET /spells/{id}` (públicas) |
| Dados | `POST /dice/roll`, `POST /dice/save`, `GET /dice/history` |
| Mesas | `/tables` (criar, listar, entrar, detalhar, editar, excluir), código de convite, transferência de anfitrião, gestão de membros e papéis |
| Operação | `GET /actuator/health` |

Requisições sem token válido recebem `401`. Documentação específica:

- [Mesas](docs/api/mesas.md)
- [Planos e limites](docs/api/planos.md)
- Coleção Postman: [`RollCore.postman_collection.json`](RollCore.postman_collection.json)

## Testes

**Backend** (JUnit 5, Mockito, testes de fatia com `@WebMvcTest`):

```bash
./mvnw -f backend/pom.xml test
```

No Windows: `.\mvnw.cmd -f backend/pom.xml test`. A suíte tem 174 testes e o pipeline exige cobertura de linhas mínima de 80% (JaCoCo).

**Web:**

```bash
cd web
npx tsc --noEmit
npm run build
```

**E2E** (Playwright, exige a API rodando com `E2E_CLEANUP_ENABLED=true`):

```bash
cd web
npx playwright test
```

**CI** (GitHub Actions):
- `ci.yml`: compila, executa testes, valida cobertura e publica a imagem no GHCR.
- `frontend.yml`: checagem de tipos e build do web.
- `playwright.yml`: testes E2E.

Relatórios e planos de teste estão em [`docs/testing`](docs/testing).

## Deploy

Configuração de referência: API no Render (`render.yaml`), banco no Supabase e web na Vercel. Passo a passo em [docs/deploy-render-supabase.md](docs/deploy-render-supabase.md).

Pontos de atenção em produção:

- Definir `E2E_CLEANUP_ENABLED=false`.
- Usar o *Session pooler* do Supabase (conexão IPv4) na URL JDBC, com `sslmode=require`.
- Gerar um `JWT_SECRET` aleatório e exclusivo do ambiente.
- No plano gratuito do Render a instância hiberna após inatividade; a primeira requisição pode levar alguns segundos. O app mobile exibe um aviso nesse caso, e um monitor externo em `/actuator/health` reduz o problema.

## Roadmap

- Sessão ao vivo por WebSocket, com rolagens compartilhadas na mesa
- Biblioteca de sistemas (Quilombo Zero, City of Myst, Ordem Paranormal, Pathfinder) e criação de sistemas próprios
- Bestiário e livraria
- Chat, calendário de sessões e notificações
- Recuperação de senha por e-mail e login social
- Upload de imagens
- Pagamento do plano `PREMIUM`
- Alinhamento das telas mobile ao design no Figma

## Documentação

- [Arquitetura](docs/architecture/RollCore_Arquitetura_v1.0.pdf)
- [Casos de uso](docs/requirements/RPG_CasosDeUso.pdf) e [visão do produto](docs/requirements/RPG_Skill_Checker_Visao.pdf)
- [Documentação de interface](docs/ui-design/RollCore-Documentacao-Interface.pdf), [design system](docs/ui-design/design-system/design-system.md) e [fluxos de usuário](docs/ui-design/user-flow/user-flow.md)
- [Testes](docs/testing)

## Equipe

- João Pedro Nunes Neto
- Leonardo Dos Santos Silva
- Lucas Gabriel Pereira Guerra
- Luis Felipe Nunes da Fonseca Figueiredo
- Luiz Phillipe de Souza Santos

## Licença

Consulte o arquivo [LICENSE](LICENSE).

O conteúdo de regras de D&D 5e baseado no System Reference Document 5.1 pertence à Wizards of the Coast e é licenciado sob [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/legalcode). D&D e Dungeons & Dragons são marcas da Wizards of the Coast; este projeto não é afiliado nem endossado por ela.
