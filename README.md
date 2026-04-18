# 🎲 RollCore

Plataforma completa (**Web + Mobile + API**) para **rolagem de dados e gerenciamento de personagens de RPG de mesa**, com foco em conformidade com casos de uso, arquitetura modular e experiência visual imersiva.

---

## 📌 Sobre o Projeto

O **RollCore** é uma ferramenta para jogadores e mestres de RPG de mesa, composta por:

- 🎨 **Frontend** Web e Mobile (React 18 + TypeScript + Capacitor)
- ⚙️ **Backend** REST API (Spring Boot 3 + PostgreSQL 16)

Casos de uso principais da Fase 1:

- **UC-01** — Autenticação segura com JWT
- **UC-02** — Gerenciamento de fichas de personagem D&D 5e
- **UC-03** — Rolagem de dados com SecureRandom e histórico

> **Fase 1 — Status atual:** Frontend: funcional com persistência local (`localStorage`).   
> Backend REST com JWT e PostgreSQL: em desenvolvimento e integração progressiva

---

## 🌐 Deploy

| Serviço | URL |
|---|---|
| Frontend | https://rollcore.vercel.app/ |
| API | Em desenvolvimento (Docker + PostgreSQL) |

---

## 🧱 Arquitetura Geral

```
Frontend (React + Vite)   →   REST API (Spring Boot)   →   PostgreSQL 16
      ↕ Capacitor                   ↕ JWT + BCrypt              ↕ Flyway
  iOS / Android              Spring Security + Bucket4j       Redis (Fase 2)
```

Este repositório é um **monorepo**:

```
RollCore/
├── src/               Frontend React (Web + Mobile via Capacitor)
├── backend/           API REST Spring Boot
├── android/           Projeto Android (Capacitor)
├── ios/               Projeto iOS (Capacitor)
├── docs/              Documentação do projeto
├── docker-compose.yml
└── README.md
```

---

## 🎨 Frontend

### Tecnologias

| Tecnologia | Uso |
|---|---|
| React 18 + TypeScript | Interface e tipagem estática |
| Vite 5 | Build tool e dev server |
| Zustand 4 | Estado global |
| Capacitor | Wrapper nativo iOS e Android |
| CSS Variables | Design tokens e temas |
| `localStorage` | Persistência de sessão e personagens (Fase 1) |

### Funcionalidades

#### 🔐 Autenticação (UC-01)
- Login com validação real contra contas cadastradas
- Botão **Entrar** desabilitado até e-mail e senha preenchidos
- Proteção contra enumeração de usuários — MSG003 genérica (OWASP / RN-03)
- Política de senha forte: mínimo 8 caracteres, 1 maiúscula, 1 número (MSG002)
- Barra de força de senha com feedback visual progressivo
- Validação de e-mail no evento `blur`
- Detecção de e-mail duplicado no cadastro — MSG001
- Username único com validação de formato (`/^[a-zA-Z0-9_]{3,20}$/`)
- Tela de recuperação de senha (placeholder — Fase 2)
- Logout com limpeza de sessão e proteção de rotas

#### 🎲 Sistema de Dados (UC-03)
- Atalhos rápidos: `d4`, `d6`, `d8`, `d10`, `d12`, `d20`, `d100`
- Suporte a fórmulas `NdX`, `NdX+M`, `NdX-M`
- Validação de fórmula em tempo real — MSG006, botão bloqueado se inválida
- Exibição: fórmula → `[individuais]` + modificador `= total`
- Animação de rolagem (CSS keyframes)
- Acerto Crítico `d20=20` → destaque dourado + label "Crítico!"
- Falha Crítica `d20=1` → destaque vermelho

#### 📜 Histórico (UC-03)
- Últimas 50 rolagens (RN-04)
- Data/hora em cada entrada — `DD/MM/AAAA HH:MM`
- Badges visuais de CRÍTICO e FALHA

#### 🧙 Personagem (UC-02)
- Criar, visualizar, editar e excluir fichas
- Combos SRD D&D 5e para Classe e Raça
- Subclasse condicional ao nível mínimo da classe
- Bônus raciais aplicados automaticamente sobre os atributos base
- Modificadores calculados em tempo real: `floor((valor–10)/2)` (RN-02)
- Bônus de Proficiência por nível — tabela SRD (RN-03)
- Abas: Combate, Perícias, Magias (conjuradores), Traços Raciais
- HP temporário com absorção antes do HP regular (PHB p.198)
- Slots de magia e Pact Magic (Warlock) com pips interativos
- Validação de nível 1–20 e atributos com feedback visual
- Exclusão com diálogo de confirmação

### Estrutura do Frontend

```
src/
├── main.tsx              Entry point
├── App.tsx               Client-side router por screen
├── index.css             Design tokens e estilos globais
├── types/index.ts        Interfaces TypeScript de domínio
├── lib/
│   ├── engine.ts         Regras D&D 5e (calcMod, profBonus, slots...)
│   ├── dice.ts           Parser de fórmulas e rolagem
│   └── storage.ts        Helpers de localStorage
├── store/
│   └── useAppStore.ts    Zustand — estado global
└── components/
    ├── ui/               Toast · Modal · DiceLogo
    ├── auth/             Login · Register · ForgotPassword · Profile
    ├── dashboard/        DashboardScreen
    ├── characters/       List · Form · Sheet
    └── dice/             DiceRollerScreen
```

### Rodar o Frontend

```bash
# Instalar dependências
npm install

# Dev server
npm run dev

# Build para produção
npm run build
```

> Requer Node.js 18+

#### Mobile (Android)

```bash
npm run build
npx cap sync android
npx cap open android
```

#### Mobile (iOS)

```bash
npm run build
npx cap sync ios
npx cap open ios
```

---

## ⚙️ Backend

### Tecnologias

| Camada | Tecnologia |
|---|---|
| API | Spring Boot 3.2 · Spring MVC |
| Segurança | Spring Security · JWT (jjwt 0.12) · BCrypt fator 12 |
| Banco de Dados | PostgreSQL 16 · Spring Data JPA · Flyway |
| Rate Limiting | Bucket4j — 60 req/min por IP |
| Documentação | Springdoc / OpenAPI 3.0 · Swagger UI |
| Testes | JUnit 5 · Mockito · JaCoCo ≥ 80% |
| Infra | Docker · Docker Compose · GitHub Actions CI/CD |

### Funcionalidades

#### 🔐 Auth (UC-01)
- `POST /auth/register` — cadastro com validação de email/username únicos (409 em conflito)
- `POST /auth/login` — login com BCrypt; mensagem genérica anti-enumeração (OWASP)
- `POST /auth/refresh` — renovação de access token via refresh token (UC-01 S01)

#### 🧙 Characters (UC-02)
- CRUD completo com verificação de ownership por JWT
- AC, spell slots e warlock slots calculados server-side pelo `DndEngine`

#### 🎲 Dice (UC-03)
- `POST /dice/roll` — rolagem com `java.security.SecureRandom` (resultado inviolável)
- `GET /dice/history` — últimas 50 rolagens persistidas

### Endpoints

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| POST | `/auth/register` | ❌ | Cadastrar usuário |
| POST | `/auth/login` | ❌ | Login |
| POST | `/auth/refresh` | ❌ | Renovar token |
| GET | `/characters` | ✅ | Listar personagens |
| POST | `/characters` | ✅ | Criar personagem |
| GET | `/characters/{id}` | ✅ | Buscar por ID |
| PUT | `/characters/{id}` | ✅ | Atualizar |
| DELETE | `/characters/{id}` | ✅ | Excluir |
| POST | `/dice/roll` | ✅ | Rolar dados |
| GET | `/dice/history` | ✅ | Histórico |

### Estrutura do Backend

```
backend/
├── Dockerfile
├── pom.xml
└── src/
    ├── main/
    │   ├── java/com/rollcore/
    │   │   ├── config/
    │   │   │   ├── SecurityConfig
    │   │   │   └── OpenApiConfig
    │   │   ├── controller/
    │   │   │   ├── AuthController.java
    │   │   │   ├── CharacterController.java
    │   │   │   └── DiceController.java
    │   │   ├── dto/
    │   │   │   ├── request/
    │   │   │   │   ├── CharacterRequest.java
    │   │   │   │   ├── LoginRequest.java
    │   │   │   │   ├── RefreshRequest.java
    │   │   │   │   ├── RegisterRequest.java
    │   │   │   │   └── RollRequest.java
    │   │   │   └── response/
    │   │   │   │   ├── AuthResponse.java
    │   │   │   │   ├── CharacterResponse.java
    │   │   │   │   └── RollResponse.java
    │   │   ├── entity/
    │   │   │   ├── Character.java
    │   │   │   ├── DiceRoll.java
    │   │   │   ├── Session.java
    │   │   │   └── User.java
    │   │   ├── exception/
    │   │   │   ├── GlobalExceptionHandler.java
    │   │   │   ├── ConflictException.java
    │   │   │   ├── ForbiddenException.java
    │   │   │   ├── InvalidFormulaException.java
    │   │   │   └── NotFoundException.java
    │   │   ├── filter/
    │   │   │   ├── JwtAuthFilter.java
    │   │   │   └── RateLimitFilter.java
    │   │   ├── repository/
    │   │   │   ├── CharacterRepository.java
    │   │   │   ├── DiceRollRepository.java
    │   │   │   └── UserRepository.java
    │   │   ├── security/
    │   │   │   ├── JwtService.java
    │   │   │   └── UserDetailsServiceImpl.java
    │   │   └── service/
    │   │       ├── AuthService.java
    │   │       ├── CharacterService.java
    │   │       ├── DiceService.java
    │   │       └── DndEngine.java
    │   └── resources/
    │   │   ├── application.yml
    │   │   ├── application-test.yml
    │   │   └── db/migration/
    │   │       ├── V1__init_schema.sql
    │   │       └── V2__fix_level_type.sql
    │── test/java/com/rollcore/
    │   ├── controller/
    │   │       ├── AuthControllerTest.java
    │   │       └── CharacterControllerTest.java
    │   ├── engine/
    │   │       └── DndEngineTest.java
    │   └── service/
    │   │       └── DiceServiceTest.java
```

### Rodar o Backend

```bash
# Subir PostgreSQL + API via Docker Compose (a partir da raiz do repositório)
docker compose up -d

# Acompanhar logs
docker compose logs -f api

# Ou rodar só o banco e subir a API com Maven
docker compose up -d db
cd backend && ./mvnw spring-boot:run
```

**Swagger UI:** http://localhost:8080/swagger-ui.html

#### Executar testes + cobertura JaCoCo

```bash
cd backend
./mvnw verify

# Relatório HTML
open target/site/jacoco/index.html
```

### Variáveis de Ambiente

| Variável | Padrão (dev) | Descrição |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://db:5432/rollcore` | URL do banco |
| `SPRING_DATASOURCE_USERNAME` | `rollcore` | Usuário do banco |
| `SPRING_DATASOURCE_PASSWORD` | `rollcore` | Senha do banco |
| `JWT_SECRET` | *(dev only)* | **Trocar em produção** — mín. 256 bits |
| `PORT` | `8080` | Porta do servidor |
| `CORS_ORIGINS` | `http://localhost:5173` | Origins permitidas (vírgula) |
| `RATE_LIMIT_RPM` | `60` | Requisições por minuto por IP |

---

## 🗺️ Roadmap

| Fase | Escopo | Status |
|---|---|---|
| **Fase 1** | Frontend com `localStorage` · UC-01/02/03 completos | ✅ Concluído |
| **Fase 2** | Backend Spring Boot + PostgreSQL · JWT · Sessões online via WebSocket · App mobile publicado | 🚧 Em desenvolvimento |
| **Fase 3** | Suporte ao sistema Ordem Paranormal · Compêndio SRD completo · Parser de PDF de regras | 📋 Planejado |

---

## 👥 Autores

Projeto desenvolvido pelo **Grupo 9**:

- João Pedro Nunes Neto
- Leonardo dos Santos Silva
- Lucas Gabriel Pereira Guerra
- Luis Felipe Nunes da Fonseca Figueiredo
- Luiz Phillipe de Souza Santos