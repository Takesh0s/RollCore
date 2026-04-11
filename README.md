# RollCore

Aplicação web e mobile para **rolagem de dados e gerenciamento de personagens de RPG**, com foco em conformidade com casos de uso, arquitetura modular e experiência visual imersiva.

---

## Sobre o Projeto

O **RollCore** é uma ferramenta frontend desenvolvida para auxiliar jogadores e mestres de RPG de mesa, oferecendo:

- Autenticação com validação de segurança (UC-01)
- Ficha de personagem D&D 5e com cálculos automáticos (UC-02)
- Rolagem de dados com suporte a fórmulas e histórico (UC-03)

> **Fase 1 — Protótipo:** A persistência de dados é feita via `localStorage`. O backend Spring Boot + PostgreSQL, autenticação JWT e sessões online via WebSocket são escopo da Fase 2.

---

## Funcionalidades

### Autenticação (UC-01)
- Login com validação real contra contas cadastradas
- Botão Entrar desabilitado até e-mail e senha preenchidos (I02 Cmd 1)
- Proteção contra enumeração de usuários — MSG003 genérica (OWASP / RN-03)
- Política de senha forte: mínimo 8 caracteres, 1 maiúscula, 1 número (MSG002)
- Barra de força de senha com feedback visual progressivo
- Validação de e-mail no evento `blur` (RAP001)
- Detecção de e-mail duplicado no cadastro — MSG001
- Tela de recuperação de senha (placeholder — Fase 2, NR-06)
- Logout com limpeza de sessão
- Proteção de rotas no frontend

### Sistema de Dados (UC-03)
- Atalhos rápidos: `d4`, `d6`, `d8`, `d10`, `d12`, `d20`, `d100`
- Suporte a fórmulas `NdX`, `NdX+M`, `NdX-M`
- Validação de fórmula em tempo real — MSG006, botão bloqueado se inválida
- Exibição: fórmula → `[individuais]` + modificador = total
- Animação de rolagem (CSS keyframes)
- Acerto Crítico d20=20 → destaque dourado + label "Crítico!" (RAP002)
- Falha Crítica d20=1 → destaque vermelho

### Histórico (UC-03)
- Últimas 50 rolagens (RN-04)
- Data/hora em cada entrada — `DD/MM/AAAA HH:MM` (S02 passo 18)
- Badges visuais de CRÍTICO e FALHA

### Personagem (UC-02)
- Criar, visualizar, editar e excluir fichas (RF0002.1 / .4 / .5 / .6)
- Combos SRD D&D 5e para Classe e Raça
- Modificadores calculados em tempo real: `floor((valor–10)/2)` (RN-02)
- Bônus de Proficiência por nível — tabela SRD (RN-03)
- Validação de nível 1–20 com MSG004 (E01)
- Validação de atributos 1–20 com borda vermelha (E03)
- Exclusão com diálogo de confirmação (S02)
- Persistência no `localStorage`

---

## Arquitetura

```
src/
├── main.tsx                        # Entry point
├── App.tsx                         # Client-side router por screen
├── index.css                       # Design tokens e estilos globais
├── types/
│   └── index.ts                    # Interfaces TypeScript
├── lib/
│   ├── engine.ts                   # Regras D&D 5e (calcMod, profBonus...)
│   ├── dice.ts                     # Engine de rolagem
│   └── storage.ts                  # Helpers de localStorage
├── store/
│   └── useAppStore.ts              # Zustand — estado global
└── components/
    ├── ui/
    │   ├── Toast.tsx
    │   ├── Modal.tsx
    │   └── DiceLogo.tsx            # SVG logo
    ├── auth/
    │   ├── LoginScreen.tsx
    │   ├── RegisterScreen.tsx
    │   └── ForgotPasswordScreen.tsx  # Placeholder — Fase 2
    ├── dashboard/
    │   └── DashboardScreen.tsx
    ├── characters/
    │   ├── CharacterListScreen.tsx
    │   ├── CharacterFormScreen.tsx  # Cria e edita (mode prop)
    │   └── CharacterSheetScreen.tsx
    └── dice/
        └── DiceRollerScreen.tsx
```

---

## Tecnologias

| Tecnologia | Uso |
|---|---|
| React 18 + TypeScript | UI e tipagem estática |
| Vite | Build tool e dev server |
| Zustand | Estado global |
| Capacitor | Wrapper nativo iOS e Android |
| CSS Variables | Design tokens e temas |
| localStorage | Persistência de sessão e personagens (Fase 1) |

---

## Como Executar

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento
npm run dev

# 3. Build para produção
npm run build
```

> Requer Node.js 18+

### Mobile (Android)

```bash
npm run build
npx cap sync android
npx cap open android
```

### Mobile (iOS)

```bash
npm run build
npx cap sync ios
npx cap open ios
```

---

## Roadmap

| Fase | Escopo |
|---|---|
| **Fase 1 — atual** | Protótipo frontend, localStorage, UC-01/02/03 |
| **Fase 2** | Backend Spring Boot + PostgreSQL, autenticação JWT, sessões online via WebSocket, recuperação de senha, app mobile publicado |
| **Fase 3** | Suporte ao sistema Ordem Paranormal, compêndio SRD completo |

---

## Autores

Projeto desenvolvido pelo **Grupo 9**:

- João Pedro Nunes Neto
- Leonardo dos Santos Silva
- Lucas Gabriel Pereira Guerra
- Luis Felipe Nunes da Fonseca Figueiredo
- Luiz Phillipe de Souza Santos
