# 🎲 RollCore — RPG Skill Checker & Companion

Plataforma **multiplataforma (Mobile + Steam para PC + API)** para **rolagem de dados e gerenciamento de personagens de RPG de mesa**, com identidade visual medieval fiel ao design system do Figma.

> Desenvolvido pela **Equipe 9** — Universidade Católica de Brasília  
> Disciplina: Análise e Projeto de Software

---

## 📌 Sobre o Projeto

O **RollCore** é uma ferramenta para jogadores e mestres de RPG de mesa composta por:

- 🎨 **Frontend** — React 18 + TypeScript + Capacitor (Mobile + Steam)
- ⚙️ **Backend** — Spring Boot 3 + PostgreSQL 16 (API REST)

### Casos de uso (Fase 1 MVP)

| UC | Funcionalidade | Status |
|---|---|---|
| **UC-01** | Cadastrar e Autenticar Usuário (JWT + BCrypt) | ✅ Implementado |
| **UC-02** | Criar e Gerenciar Ficha de Personagem D&D 5e | ✅ Implementado |
| **UC-03** | Rolar Dados Virtuais (SecureRandom server-side) | ✅ Implementado |
| **UC-04** | Sessão Online via WebSocket (STOMP) | 🚧 Fase 2 |

---

## 🖥️ Plataformas

| Plataforma | Distribuição | Tecnologia |
|---|---|---|
| **Android** | Google Play Store (Fase 2) | Capacitor → APK nativo |
| **iOS** | Apple App Store (Fase 2) | Capacitor → build Xcode |
| **PC (Windows / macOS / Linux)** | **Steam** | Capacitor + Electron |
| **API (backend)** | Render (produção) | Spring Boot 3 / Docker |

---

## 🎨 Design System — Figma v1.1

O visual segue fielmente os frames do Figma (Desktop 1–12, Mobile). A identidade visual é **medieval/fantasia** com:

### Paleta de cores

| Token CSS | Hex | Uso |
|---|---|---|
| `--card` | `#400101` | Fundo principal — vinho escuro |
| `--card-raised` | `#461615` | Header, seções internas — vinho médio |
| `--gold` | `#C8963E` | Dourado Principal — títulos, ícones, bordas |
| `--gold-dim` | `#997733` | Dourado Escuro — bordas sutis, estado inativo |
| `--gold-light` (alias `--text-muted`) | `#E8B86D` | Dourado Claro — labels, texto secundário |
| `--input-bg` | `#624A2E` | Marrom claro — fundo dos campos |
| `--bg` / body | `#7A6040` | Marrom neutro — fundo externo (desktop) |
| `--sapphire` | `#227BFF` | HP temporário (barra azul) |
| `--success` / crit verde | `#53A653` | Sucesso crítico |
| `--fail` / crit vermelho | `#BC0E0E` | Falha crítica / HP crítico |

### Frame de estandarte medieval

Todas as telas são exibidas dentro de um **frame de estandarte medieval**: card central com borda dourada fina de 2px, borda interna decorativa, e **franjas medievais** na base (tabs verticais douradas). O fundo externo é o marrom neutro `#7A6040`.

```
┌─────────────────────────────────────────┐  ← borda dourada 2px (#997733)
│ ┌─────────────────────────────────────┐ │  ← borda interna decorativa
│ │           CONTEÚDO DA TELA         │ │
│ │   Header: ≡  Título  👤            │ │
│ │   (background: #461615)            │ │
│ │   ...                              │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
    ▮▮  ▮▮  ▮▮  ▮▮  ▮▮  ▮▮  ▮▮           ← franjas medievais (#997733)
```

### Tipografia

| Tipo | Fonte | Uso |
|---|---|---|
| Display | Cinzel Decorative | Logo, títulos de tela (Mesas, Fichas, Dados…) |
| Títulos | Cinzel | Seções, botões, labels em caps |
| Corpo | Crimson Pro | Texto geral, campos, descrições |

### Componentes principais

**Botão CTA (principal):**
- Fundo `#3D1A0A`, borda dourada, texto dourado itálico, border-radius 24px (pílula)
- Glow laranja-dourado: `box-shadow: 0 0 18px rgba(200,120,30,0.6), 0 0 40px rgba(200,100,20,0.25)`

**Header de todas as telas internas:**
- `background: #461615` · `border-bottom: 2px solid #997733`
- Hambúrguer (≡) à esquerda · Título (Cinzel Decorative, dourado) centralizado · Ícone 👤 à direita
- **Não há barra de navegação inferior** — toda navegação é pelo menu hambúrguer

**Campos de input:**
- Fundo `#624A2E`, sem borda visível, texto dourado claro `#E8B86D`, placeholder dourado escuro

---

## 🏗️ Arquitetura

```
┌──────────────────────────────────────────────────────────────────────┐
│                      CAMADA DE APRESENTAÇÃO                          │
│  📱 Mobile (iOS / Android)            🖥️ PC via Steam               │
│  Capacitor → APK / IPA                Capacitor + Electron           │
│  React 18 + TypeScript + Vite · Zustand (estado global)              │
└────────────────────────────┬─────────────────────────────────────────┘
                             │  HTTPS / REST + JSON
                             ↕  (Fase 2: WSS / STOMP)
┌────────────────────────────┴─────────────────────────────────────────┐
│                    CAMADA DE APLICAÇÃO / API                         │
│  Spring Boot 3 / Java 21                                             │
│  REST Controllers · Spring Security + JWT · Rate Limiting (60/min)  │
│  Engine D&D 5e (Java puro) · Dice Service (SecureRandom)            │
│  WebSocket Controller STOMP — Fase 2                                 │
└──────────┬──────────────────────────────────────────┬───────────────┘
           │ JDBC / JPA                               │ Redis Client
           ↕                                          ↕
  ┌────────┴───────┐                      ┌───────────┴──────────────┐
  │ PostgreSQL 16  │                      │ Redis 7                  │
  │ users          │                      │ refresh tokens (TTL 7d)  │
  │ characters     │                      │ sessões ao vivo (Fase 2) │
  │ dice_rolls     │                      └──────────────────────────┘
  │ sessions       │
  └────────────────┘
[ Docker + Docker Compose | GitHub Actions CI/CD | Render (backend) | Steam (PC) ]
```

### Estrutura de pastas

```
RollCore/
├── src/
│   ├── App.tsx                     Roteamento + frame estandarte + franjas
│   ├── index.css                   Design System completo (tokens Figma v1.1)
│   ├── types/index.ts
│   ├── lib/
│   │   ├── engine.ts               Regras D&D 5e (calcMod, profBonus, slots, raças)
│   │   ├── engine-hp.ts            HP máximo, CA
│   │   ├── dice.ts                 Parser de fórmulas NdX+M, validação, histórico
│   │   ├── spells.ts               Compêndio de magias SRD
│   │   └── storage.ts
│   ├── store/useAppStore.ts        Zustand — estado global
│   └── components/
│       ├── ui/                     Toast · Modal · DiceLogo · AvatarUpload · SpellDetail
│       ├── auth/                   LoginScreen · RegisterScreen · ProfileScreen
│       ├── dashboard/              DashboardScreen (Mesas + D20 + Fichas)
│       ├── characters/             CharacterListScreen · CharacterFormScreen · CharacterSheetScreen
│       └── dice/                   DiceRollerScreen
├── backend/                        API REST Spring Boot 3
│   ├── src/main/java/br/com/rollcore/
│   │   ├── controller/             Auth · Character · Dice · (WebSocket Fase 2)
│   │   ├── service/                Auth · Character · Dice · (Session Fase 2)
│   │   ├── security/               JwtFilter · SecurityConfig · RateLimitingFilter
│   │   ├── engine/                 DnD5eEngine (calcMod, profBonus, spell slots)
│   │   ├── repository/             JPA repos
│   │   └── entity/                 User · Character · DiceRoll · Session
│   ├── Dockerfile
│   └── pom.xml
├── android/                        Projeto Android (Capacitor)
├── ios/                            Projeto iOS (Capacitor)
├── docs/                           Documentação oficial do projeto
│   ├── architecture/               Documento de Arquitetura (4+1) v1.0
│   ├── requirements/               Documento de Visão v1.0 · Casos de Uso v1.0
│   ├── testing/                    Plano de Testes v1.0
│   └── ui-design/                  Documentação de Interface v1.1 · Figma frames
├── docker-compose.yml
├── render.yaml
├── capacitor.config.ts
├── design-system.md
├── user-flow.md
└── README.md
```

---

## 🎲 Telas implementadas (Figma → Código)

| Frame | Tela | Componente |
|---|---|---|
| Desktop-1 | Login | `LoginScreen.tsx` |
| Desktop-2 | Cadastro | `RegisterScreen.tsx` |
| Desktop-3 | Home / Dashboard | `DashboardScreen.tsx` |
| Desktop-3.2 | Menu Lateral (hambúrguer) | `DashboardScreen.tsx` (inline) |
| Desktop-4 | Meu Perfil | `ProfileScreen.tsx` |
| Desktop-5 | Configurações | *(Fase 2)* |
| Desktop-6 | Lista de Mesas | `DashboardScreen.tsx` (seção Mesas) |
| Desktop-7 / 7.2 | Criar / Editar Mesa | *(Fase 2 — CRUD de mesas)* |
| Desktop-8 | Lista de Fichas | `CharacterListScreen.tsx` |
| Desktop-9 / 9.2 | Ficha / Criar Ficha | `CharacterFormScreen.tsx` |
| Desktop-10 | Inventário | `CharacterSheetScreen.tsx` |
| Desktop-11 | Grimório | `CharacterSheetScreen.tsx` (aba Magias) |
| Desktop-12 | Dados (rolador) | `DiceRollerScreen.tsx` |

---

## ⚙️ Backend

### Endpoints REST

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| POST | `/auth/register` | público | Cadastrar usuário |
| POST | `/auth/login` | público | Login → JWT access + refresh |
| POST | `/auth/refresh` | público | Renovar access token |
| GET | `/characters` | ✅ JWT | Listar personagens |
| POST | `/characters` | ✅ JWT | Criar personagem |
| GET | `/characters/{id}` | ✅ JWT | Buscar ficha |
| PUT | `/characters/{id}` | ✅ JWT | Atualizar ficha |
| DELETE | `/characters/{id}` | ✅ JWT | Excluir ficha |
| GET | `/spells` | público | Compêndio SRD |
| POST | `/dice/roll` | ✅ JWT | Rolar dados (SecureRandom) |
| GET | `/dice/history` | ✅ JWT | Últimas 50 rolagens |
| GET | `/actuator/health` | público | Health check |

### Variáveis de ambiente

| Variável | Padrão (dev) | Descrição |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://db:5432/rollcore` | URL JDBC |
| `SPRING_DATASOURCE_USERNAME` | `rollcore` | Usuário do banco |
| `SPRING_DATASOURCE_PASSWORD` | `rollcore` | Senha do banco |
| `JWT_SECRET` | *(dev only)* | **Obrigatório em produção** — mín. 256 bits |
| `PORT` | `8080` | Porta da API |
| `CORS_ORIGINS` | `http://localhost:5173` | Origins permitidas |

---

## 🚀 Rodando localmente

### Backend (Docker)

```bash
# Sobe PostgreSQL 16 + API Spring Boot
docker compose up -d

# Logs
docker compose logs -f api

# Swagger UI
open http://localhost:8080/swagger-ui.html
```

### Frontend (dev server)

```bash
npm install
npm run dev
# → http://localhost:5173
```

### Build mobile

```bash
npm run build

# Android
npx cap sync android && npx cap open android

# iOS
npx cap sync ios && npx cap open ios
```

### Build Steam (PC)

```bash
npm run build
npm run build:steam    # Electron + Capacitor → executável nativo
# Publicar via Steamworks SDK
```

### Testes (cobertura JaCoCo ≥ 80%)

```bash
cd backend && ./mvnw verify
open target/site/jacoco/index.html
```

---

## 🗺️ Roadmap

| Fase | Escopo | Status |
|---|---|---|
| **Fase 1 MVP** | UC-01/02/03 · Backend REST + JWT · Compêndio SRD · Deploy Render · Capacitor Mobile + Steam | ✅ Concluído |
| **Fase 2** | UC-04 WebSocket/STOMP · Sessões online · Lojas mobile · Histórico de sessões · CRUD de mesas completo | 🚧 Em desenvolvimento |
| **Fase 3** | Suporte Ordem Paranormal · Parser PDF de regras · Testes WCAG | 📋 Planejado |

---

## 📁 Documentação

| Documento | Versão | Pasta |
|---|---|---|
| Documento de Visão | v1.0 | `docs/requirements/` |
| Especificação de Casos de Uso | v1.0 | `docs/requirements/` |
| Documento de Arquitetura (4+1) | v1.0 | `docs/architecture/` |
| Plano de Testes | v1.0 | `docs/testing/` |
| Documentação de Interface e Prototipação | v1.1 | `docs/ui-design/` |
| Design System | v1.0 | `design-system.md` |
| User Flow | v1.0 | `user-flow.md` |

---

## 👥 Equipe

| Nome |
|---|
| João Pedro Nunes Neto |
| Lucas Gabriel Pereira Guerra |
| Luis Felipe Nunes da Fonseca Figueiredo |
| Luiz Phillipe de Souza Santos |
| Leonardo Dos Santos Silva |

---

## 📄 Licença

Conteúdo de regras D&D 5e derivado do **System Reference Document (SRD)** da Wizards of the Coast, licenciado sob **CC BY 4.0**.
