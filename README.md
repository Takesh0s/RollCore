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

> **Fase 1 — Status atual:** Backend em produção no Render. Frontend em produção no Vercel. Fase 2 em desenvolvimento.

---

## 🌐 Deploy (Produção)

| Serviço | URL |
|---|---|
| Frontend | https://rollcore.vercel.app |
| API (backend) | https://rollcore-api.onrender.com |
| Banco de Dados | PostgreSQL — Render (interno) |

> **Aviso:** o plano gratuito do Render coloca o serviço em modo de espera após 15 min sem requisições. O primeiro acesso pode demorar ~30 segundos para acordar.

### Verificar saúde do backend

```bash
curl https://rollcore-api.onrender.com/actuator/health
# esperado: {"status":"UP"}
```

---

## 🧱 Arquitetura Geral

```
Frontend (React + Vite)   →   REST API (Spring Boot)   →   PostgreSQL 16
      ↕ Capacitor                   ↕ JWT + BCrypt              ↕ Flyway
  iOS / Android              Spring Security + Bucket4j       Redis (Fase 2)
```

O Capacitor empacota o frontend React e aponta para a mesma `VITE_API_URL` — o app mobile funciona em qualquer rede, sem precisar do Docker local.

```
RollCore/
├── src/               Frontend React (Web + Mobile via Capacitor)
├── backend/           API REST Spring Boot
├── android/           Projeto Android (Capacitor)
├── ios/               Projeto iOS (Capacitor)
├── docs/              Documentação do projeto
├── docker-compose.yml Ambiente de desenvolvimento local
├── render.yaml        Configuração de deploy no Render
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
| `localStorage` | Cache local de sessão e personagens |

### Funcionalidades

#### 🔐 Autenticação (UC-01)
- Login com validação real contra contas cadastradas
- Proteção contra enumeração de usuários — MSG003 genérica (OWASP / RN-03)
- Política de senha forte: mínimo 8 caracteres, 1 maiúscula, 1 número (MSG002)
- Barra de força de senha com feedback visual progressivo
- Detecção de e-mail duplicado no cadastro — MSG001
- Username único com validação de formato
- Logout com limpeza de sessão e proteção de rotas

#### 🎲 Sistema de Dados (UC-03)
- Atalhos rápidos: `d4`, `d6`, `d8`, `d10`, `d12`, `d20`, `d100`
- Suporte a fórmulas `NdX`, `NdX+M`, `NdX-M`
- Validação de fórmula em tempo real
- Animação de rolagem
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
  - Cliques nos pips salvam apenas no localStorage (estado de sessão)
  - PUT para o backend ocorre somente em alterações de HP/atributos
- Avatar preservado localmente entre reloads
- Exclusão com diálogo de confirmação

#### 📚 Compêndio de Magias
- GET `/spells` — público, sem autenticação (SRD CC BY 4.0)
- Filtros: classe, nível, busca por nome
- Adicionar/remover magias de um personagem (JWT obrigatório)
- Seed com magias do Livro do Jogador e Compêndio de Magia

#### Engine D&D 5e — tipos de conjurador (PHB)

| Tipo | Classes / Subclasses |
|---|---|
| `full` | Bardo, Clérigo, Druida, Feiticeiro, Mago |
| `half` | Paladino, Patrulheiro |
| `third` | Cavaleiro Arcano (Guerreiro nv 3+), Trapaceiro Arcano (Ladino nv 3+) |
| `warlock` | Bruxo (Pact Magic) |
| `none` | Bárbaro, Guerreiro (demais subclasses), Ladino (demais subclasses), Monge |

> Monge Via da Sombra usa Pontos de Ki, não espaços de magia — não exibe aba Magias (PHB p.80).

### Estrutura do Frontend

```
src/
├── main.tsx
├── App.tsx
├── index.css
├── types/index.ts
├── lib/
│   ├── engine.ts         Regras D&D 5e (calcMod, profBonus, slots, subclasses)
│   ├── dice.ts
│   ├── spells.ts         Helpers para API de magias
│   └── storage.ts
├── store/
│   └── useAppStore.ts    Zustand — estado global + patchCharacterLocal
└── components/
    ├── ui/               Toast · Modal · DiceLogo · SpellDetail
    ├── auth/             Login · Register · ForgotPassword · Profile
    ├── dashboard/        DashboardScreen
    ├── characters/       List · Form · Sheet · SpellSearchModal
    └── dice/             DiceRollerScreen
```

### Rodar o Frontend (desenvolvimento local)

```bash
npm install
npm run dev
# Aponta para http://localhost:8080 por padrão
# Para usar o backend em produção:
# VITE_API_URL=https://rollcore-api.onrender.com npm run dev
```

#### Mobile (Android)

```bash
npm run build && npx cap sync android && npx cap open android
```

#### Mobile (iOS)

```bash
npm run build && npx cap sync ios && npx cap open ios
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
| Infra | Docker · Docker Compose · Render (produção) |

### Endpoints

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| POST | `/auth/register` | público | Cadastrar usuário |
| POST | `/auth/login` | público | Login |
| POST | `/auth/refresh` | público | Renovar token |
| GET | `/characters` | ✅ | Listar personagens |
| POST | `/characters` | ✅ | Criar personagem |
| GET | `/characters/{id}` | ✅ | Buscar por ID |
| PUT | `/characters/{id}` | ✅ | Atualizar |
| DELETE | `/characters/{id}` | ✅ | Excluir |
| GET | `/spells` | público | Compêndio (SRD CC BY 4.0) |
| GET | `/spells/{id}` | público | Magia por ID |
| GET | `/characters/{id}/spells` | ✅ | Magias do personagem |
| POST | `/characters/{id}/spells/{spellId}` | ✅ | Adicionar magia |
| DELETE | `/characters/{id}/spells/{spellId}` | ✅ | Remover magia |
| POST | `/dice/roll` | ✅ | Rolar dados (SecureRandom server-side) |
| POST | `/dice/save` | ✅ | Persistir resultado calculado pelo cliente |
| GET | `/dice/history` | ✅ | Últimas 50 rolagens |

### Migrations Flyway

| Versão | Descrição |
|---|---|
| V1 | Schema inicial (users, characters, dice_rolls, sessions) |
| V2 | Fix tipo da coluna `level` |
| V3 | Schema de magias (spells, character_spells) |
| V4 | Seed do compêndio SRD |
| V5 | Fix tipo da coluna `level` em spells |

### Variáveis de Ambiente

| Variável | Padrão (dev) | Descrição |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://db:5432/rollcore` | URL do banco |
| `SPRING_DATASOURCE_USERNAME` | `rollcore` | Usuário do banco |
| `SPRING_DATASOURCE_PASSWORD` | `rollcore` | Senha do banco |
| `JWT_SECRET` | *(dev only)* | **Obrigatório em produção** — mín. 256 bits |
| `PORT` | `8080` | Porta (injetada automaticamente pelo Render) |
| `CORS_ORIGINS` | `http://localhost:5173` | Origins permitidas (vírgula) |
| `RATE_LIMIT_RPM` | `60` | Requisições por minuto por IP |

---

## 🚀 Deploy — Render + PostgreSQL

### Configuração atual

O `render.yaml` na raiz do repositório configura o serviço. O Render faz build e deploy automático a cada `git push` na `main`. As variáveis ficam no painel Render → Environment tab.

### Configurar do zero

1. **Render** → New → Blueprint → conectar repositório → Apply
2. New → PostgreSQL → criar banco `rollcore-db`
3. Em Environment, adicionar:
   - `SPRING_DATASOURCE_URL` → Internal Database URL com `jdbc:` na frente
   - `SPRING_DATASOURCE_USERNAME` / `SPRING_DATASOURCE_PASSWORD`
   - `JWT_SECRET` → `node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"`
   - `CORS_ORIGINS` → `https://rollcore.vercel.app`
4. **Vercel** → Environment Variables → `VITE_API_URL=https://rollcore-api.onrender.com` → Redeploy

---

## 💻 Desenvolvimento Local (Docker)

```bash
# Subir PostgreSQL + API
docker compose up -d

# Acompanhar logs
docker compose logs -f api

# Rebuild após mudanças no backend
docker compose down && docker compose up -d --build
```

**Swagger UI (local):** http://localhost:8080/swagger-ui.html

### Testes + cobertura JaCoCo

```bash
cd backend
./mvnw verify
open target/site/jacoco/index.html
```

---

## 🗺️ Roadmap

| Fase | Escopo | Status |
|---|---|---|
| **Fase 1** | Frontend · UC-01/02/03 · Backend REST + JWT · Compêndio de Magias · Deploy Render/Vercel | ✅ Concluído |
| **Fase 2** | Sessões online WebSocket · App mobile nas lojas · Histórico de sessões | 🚧 Em desenvolvimento |
| **Fase 3** | Suporte ao sistema Ordem Paranormal · Compêndio SRD completo · Parser de PDF | 📋 Planejado |

---

## 👥 Autores

Projeto desenvolvido pelo **Grupo 9** — Universidade Católica de Brasília:

- João Pedro Nunes Neto
- Leonardo dos Santos Silva
- Lucas Gabriel Pereira Guerra
- Luis Felipe Nunes da Fonseca Figueiredo
- Luiz Phillipe de Souza Santos