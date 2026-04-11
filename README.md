# 🎲 RPG Skill Checker

Aplicação web para **rolagem de dados e gerenciamento básico de personagens de RPG**, com foco em simplicidade, velocidade e uma experiência visual moderna.

---

## 📌 Sobre o Projeto

O **RPG Skill Checker** é uma ferramenta frontend desenvolvida para auxiliar jogadores de RPG de mesa, oferecendo:

* Rolagem rápida de dados
* Suporte a fórmulas (ex: `2d6+3`)
* Visualização de atributos de personagens
* Histórico de rolagens em tempo real

Este projeto foi construído com **JavaScript puro (Vanilla JS)**, focando em arquitetura modular e boas práticas.

---

## 🚀 Funcionalidades

### 🔐 Autenticação (Mock)

* Login e cadastro com validação de campos
* Opção "manter conectado" com `localStorage`
* Proteção de rotas no frontend

---

### 🎲 Sistema de Dados

* Rolagem rápida (`d4`, `d6`, `d8`, `d10`, `d12`, `d20`, `d100`)
* Suporte a fórmulas:

  * `2d6+3`
  * `1d20-1`
* Animação de rolagem
* Detecção de:

  * 🎉 Crítico (20)
  * 💀 Falha crítica (1)

---

### 📜 Histórico

* Exibição das últimas rolagens
* Suporte para:

  * Dados simples
  * Fórmulas
  * Testes de perícia
* Limite de histórico para performance

---

### 🎭 Personagem

* Exibição de ficha básica:

  * Nome, classe, nível
  * Atributos (FOR, DES, CON, etc.)
  * Modificadores automáticos
  * HP, CA e bônus de proficiência

---

## 🧩 Arquitetura do Projeto

O projeto segue uma estrutura modular simples e organizada:

```
frontend/
 ├── js/
 │   ├── app.js       # Lógica principal e controle de fluxo
 │   ├── state.js     # Estado global da aplicação
 │   ├── dice.js      # Engine de rolagem de dados
 │   ├── engine.js    # Regras de RPG (modificadores,perícias)
 │   └── ui.js        # Manipulação de UI
 │
 └── css/
     └── style.css    # Estilização da aplicação

index.html            # Estrutura principal da interface
```

---

## ⚙️ Tecnologias Utilizadas

* HTML5
* CSS3 (com variáveis e responsividade)
* JavaScript (ES Modules)
* LocalStorage (persistência simples)

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

## 📈 Próximos Passos (Roadmap)

* [ ] Sistema real de autenticação (backend)
* [ ] Criação e edição de personagens
* [ ] Sistema de perícias completo (D&D 5e)
* [ ] Persistência de dados (API + banco)
* [ ] Sessões multiplayer em tempo real
* [ ] Interface mobile (PWA ou React Native)

---

## 💡 Aprendizados

Este projeto foi desenvolvido com foco em:

* Organização de código em módulos
* Separação de responsabilidades (UI / lógica / estado)
* Manipulação de DOM com JavaScript puro
* Boas práticas de versionamento com Git

---

## 👨‍💻 Autores

Projeto desenvolvido pelo **Grupo 9**:

* João Pedro Nunes Neto
* Leonardo dos Santos Silva
* Lucas Gabriel Pereira Guerra
* Luis Felipe Nunes da Fonseca Figueiredo
* Luiz Phillipe de Souza Santos