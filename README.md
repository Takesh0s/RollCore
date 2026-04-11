# 🎲 RollCore

Aplicação web para **rolagem de dados e gerenciamento de personagens de RPG**, com foco em conformidade com casos de uso, arquitetura modular e experiência visual imersiva.

---

## 📌 Sobre o Projeto

O **RollCore** é uma ferramenta frontend desenvolvida para auxiliar jogadores e mestres de RPG de mesa, oferecendo:

* Autenticação com validação de segurança (UC-01)
* Ficha de personagem D&D 5e com cálculos automáticos (UC-02)
* Rolagem de dados com suporte a fórmulas e histórico (UC-03)

Este projeto foi construído com **JavaScript puro (Vanilla JS)**, focando em arquitetura modular, separação de responsabilidades e aderência aos documentos de requisitos da Equipe 9.

---

## 🚀 Funcionalidades

### 🔐 Autenticação (UC-01)

* Login e cadastro com validação de campos em tempo real
* Política de senha forte: mínimo 8 caracteres, 1 letra maiúscula e 1 número (MSG002)
* Barra de força de senha com feedback visual progressivo
* Proteção contra enumeração de usuários — mensagem de erro genérica no login (MSG003 / OWASP)
* Detecção de e-mail duplicado no cadastro (MSG001)
* Opção "Manter conectado" com persistência via `localStorage`
* Proteção de rotas no frontend

---

### 🎲 Sistema de Dados (UC-03)

* Rolagem rápida por atalhos: `d4`, `d6`, `d8`, `d10`, `d12`, `d20`, `d100`
* Suporte a fórmulas no formato `NdX`, `NdX+M` e `NdX-M`:
  * `2d6+3`
  * `1d20-1`
  * `4d4`
* Validação de fórmula em tempo real (MSG006) — botão bloqueado enquanto inválida
* Exibição completa do resultado: fórmula → `[individuais]` = total
* Animação de rolagem
* Detecção de:
  * 🏆 Acerto Crítico — d20 = 20 → destaque dourado + label "Crítico!"
  * 💀 Falha Crítica — d20 = 1 → destaque vermelho

---

### 📜 Histórico (UC-03)

* Exibição das últimas 50 rolagens (RN-04)
* Badges visuais de crítico e falha crítica
* Suporte para dados simples, fórmulas e testes de perícia

---

### 🎭 Personagem (UC-02)

* Exibição de ficha D&D 5e:
  * Nome, classe, raça e nível
  * Atributos em PT-BR: FOR, DES, CON, INT, SAB, CAR
  * Modificadores calculados automaticamente: `floor((valor – 10) / 2)`
  * Bônus de Proficiência por nível conforme tabela SRD D&D 5e:

    | Nível   | Bônus |
    |---------|-------|
    | 1 – 4   | +2    |
    | 5 – 8   | +3    |
    | 9 – 12  | +4    |
    | 13 – 16 | +5    |
    | 17 – 20 | +6    |

  * HP e Classe de Armadura (CA)

---

## 🧩 Arquitetura do Projeto

O projeto segue uma estrutura modular com separação clara de responsabilidades:

```
RollCore/
├── index.html                        # Estrutura principal da interface
└── frontend/
    ├── styles/
    │   └── style.css                 # Design tokens, layout e responsividade
    ├── core/
    │   ├── app.js                    # Orquestrador principal — bindings e fluxo
    │   └── state.js                  # Estado global da aplicação
    ├── modules/
    │   ├── character/
    │   │   └── engine.js             # Regras D&D 5e (modificadores, proficiência, perícias)
    │   └── dice/
    │       └── dice.js               # Engine de rolagem de dados
    └── ui/
        ├── components/
        │   └── dice.js               # Renderização do resultado e efeitos visuais
        └── screens/
            └── navigation.js         # Controle de telas ativas
```

---

## ⚙️ Tecnologias Utilizadas

* HTML5
* CSS3 (variáveis, grid, animações, responsividade)
* JavaScript ES Modules (Vanilla JS)
* LocalStorage (persistência de sessão)

---

## ▶️ Como Executar

1. Clone o repositório:

```bash
git clone https://github.com/Takesh0s/RollCore.git
cd RollCore
```

2. Abra o arquivo `index.html` no navegador

> Não é necessário backend ou instalação de dependências.

---

## 👨‍💻 Autores

Projeto desenvolvido pelo **Grupo 9**:

* João Pedro Nunes Neto
* Leonardo dos Santos Silva
* Lucas Gabriel Pereira Guerra
* Luis Felipe Nunes da Fonseca Figueiredo
* Luiz Phillipe de Souza Santos