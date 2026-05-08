# User Flow — RollCore

## Visão Geral

O RollCore é uma plataforma para gestão de mesas de RPG, com suporte a campanhas, fichas de personagem, rolagem de dados e grimório de magias. O fluxo de usuário abrange autenticação, navegação principal e acesso às funcionalidades específicas de cada módulo.

---

## 1. Fluxo de Autenticação

### 1.1 Ponto de Entrada
O usuário acessa o app e é direcionado automaticamente para a tela de **Login**, caso não esteja autenticado.

### 1.2 Login
**Tela:** `Login`

| Campo | Tipo | Observação |
|---|---|---|
| Email | Input text | Campo obrigatório |
| Senha | Input password | Campo obrigatório |
| Mantenha conectado | Checkbox | Persiste sessão |

**Ações disponíveis:**
- **Entrar** → autentica e redireciona para a Home
- **Criar conta** → redireciona para a tela de Cadastro

### 1.3 Cadastro
**Tela:** `Cadastro`

| Campo | Tipo | Validação |
|---|---|---|
| Nome de usuário | Input text | 3–20 caracteres; apenas letras, números e `_` |
| Email | Input text | Formato de e-mail válido |
| Senha | Input password | Mínimo 8 caracteres, 1 maiúsculo e 1 minúsculo |
| Confirmar senha | Input password | Deve ser igual ao campo Senha |

**Ações disponíveis:**
- **Criar conta** → cria a conta e redireciona para a Home
- **Usar conta existente** / **Já tenho conta** → retorna para o Login

---

## 2. Home / Dashboard

Após autenticação, o usuário chega à **Home**, que exibe:

- **Mesas:** cartão de acesso rápido à campanha ativa, com imagem de capa e botão "Entrar"
- **Dados:** acesso rápido ao rolador de dados (d4 a d20 + custom)
- **Fichas:** acesso rápido à lista de personagens

**Navegação principal:** acessada pelo ícone de menu hambúrguer (≡) no canto superior esquerdo.

---

## 3. Menu de Navegação

O menu lateral (hambúrguer) dá acesso a todas as seções principais:

| Ícone | Seção | Destino |
|---|---|---|
| 🏠 | Início / Home Page | Tela principal |
| 🔔 | Notificações | Lista de notificações |
| 📖 | Mesas | Campanhas salvas |
| 🗺️ | Criação de Mapas | Editor de mapas |
| 📅 | Calendário | Calendário da campanha |
| 📚 | Sistemas | Sistemas de RPG suportados |
| 🔮 | Grimório | Livro de magias |
| 💬 | Tutoriais | Guias e tutoriais |
| 🎲 | Créditos | Créditos do projeto |
| ⚙️ | Configurações | Preferências do app |

**Ícone de perfil** (canto superior direito) → acessa **Meu Perfil**.

---

## 4. Módulo: Mesas

### 4.1 Lista de Mesas
Exibe campanhas salvas do usuário como cartões com:
- Imagem de capa
- Nome da campanha
- Botão **Entrar** (entra na mesa)
- Botão **Editar** (visível somente para o mestre da mesa)
- Botão de filtro (funil) no canto superior direito

### 4.2 Criar Mesa
Acessado pelo botão `+` na tela de Mesas.

| Campo | Tipo | Observação |
|---|---|---|
| Nome da campanha | Input text | Obrigatório |
| Sistema | Select | Ex: D&D 5e |
| Descrição da campanha | Textarea | Opcional |
| Número de jogadores | Select numérico | Ex: 5, 9... |
| Capa | Upload de imagem | Opcional |

**Ação:** **Salvar** → cria a mesa e volta para a lista.

### 4.3 Editar Mesa
Mesma tela de Criar Mesa, com os campos pré-preenchidos.

---

## 5. Módulo: Dados (Rolador)

**Tela:** `Dados`

### 5.1 Fórmula Livre
- Campo de texto aceita expressões no formato `2d6 + 3D10 + 2`
- Botão **Rolar Dados** executa e exibe o resultado

### 5.2 Dados Rápidos
Botões de acesso rápido para cada tipo de dado:
`d4` · `d6` · `d8` · `d10` · `d12` · `d20` · `d?` (custom)

### 5.3 Ataques Salvos
Tags de ataques previamente configurados (ex: "Adaga envenenada", "Rapieira") que executam a rolagem completa com dano e tipo.

### 5.4 Histórico
Lista de rolagens anteriores com:
- Expressão utilizada (ex: `3d6 → [1, 6, 6]`)
- Data e hora
- Resultado total
- Contexto (nome do ataque, tipo de dano, sucesso crítico, etc.)

---

## 6. Módulo: Fichas

### 6.1 Lista de Fichas
Exibe todos os personagens do usuário com:
- Avatar do personagem (foto circular)
- Nome do personagem
- Botão **Editar**
- Botão `+` para criar nova ficha
- Botão de filtro

### 6.2 Criar / Editar Ficha
**Tela:** `Criar Ficha` / `Ficha`

| Campo | Tipo | Observação |
|---|---|---|
| Nome do personagem | Input text | Campo com ícone de pena para edição rápida |
| Nível | Select numérico | 0–20 |
| Raça | Select | Lista de raças disponíveis |
| Classe | Select | Ex: Ladino, Mago... |
| Subclasse | Select | Depende da Classe selecionada |
| História do personagem | Textarea | Opcional |
| Idade | Select numérico | |
| Aparência (foto) | Upload de imagem | Opcional |

**Ações:**
- **Inventário** (botão lateral) → abre o módulo de Inventário
- **Salvar** → salva alterações

### 6.3 Inventário
**Tela:** `Inventário`

Exibe dados vitais e itens do personagem:

**Dados vitais:**
- Barra de Pontos de Vida (HP atual / HP máximo) com visualização colorida (azul/verde/vermelho)
- Escudo de Classe de Armadura (CA)
- Moedas: Platina · Ouro · Prata · Cobre

**Tabela de Itens:**

| Coluna | Descrição |
|---|---|
| ✔/✗ | Equipado ou não |
| 🟢/⚫ | Disponível ou indisponível |
| Nome | Nome do item |
| Dano/AC | Ex: 1D8 Perf., 11 + Dex CA |
| Quant. | Quantidade em posse |

**Ação:** **Adicionar** → adiciona novo item ao inventário.

---

## 7. Módulo: Grimório

**Tela:** `Grimório`

Organizado por nível de magia:
- **Truques** (Nível 0)
- **Magias de Nível 1**
- **Magias de Nível 2**
- *(e assim por diante...)*

Cada magia exibe: nome, escola, tempo de conjuração, alcance e duração.

**Ação:** **Adicionar magias** (em cada nível) → abre a busca/seleção de novas magias.

Filtro disponível pelo ícone de funil no canto superior direito.

---

## 8. Módulo: Perfil

**Tela:** `Meu Perfil`

Acessado pelo ícone de perfil (👤) no canto superior direito em qualquer tela.

| Campo | Editável | Observação |
|---|---|---|
| Avatar | Não (Fase 1) | Ícone genérico |
| Nome de usuário | Sim | |
| E-mail | Não | Disponível na Fase 2 |

**Ação:** **Salvar alterações**

---

## 9. Módulo: Configurações

**Tela:** `Configurações`

### Geral
| Opção | Tipo | Padrão |
|---|---|---|
| Notificações | Toggle | Ativo |
| Idioma | Select | PT/BR |

### Acessibilidade
| Opção | Tipo | Padrão |
|---|---|---|
| Modo Daltônico | Toggle | Inativo |
| Tamanho de Fonte | Select | 10px |

### Personalização
| Opção | Tipo | Padrão |
|---|---|---|
| Tema | Select | Medieval |
| Cores | Seletor de cor | Predefinidas + custom |

### Conta
- **Logout** → encerra sessão e retorna à tela de Login
- **Excluir Conta** → ação destrutiva com confirmação

**Ação:** **Salvar** (botão no topo direito)

---

## 10. Resumo do Fluxo Principal

```
Acesso ao app
    ↓
[Autenticado?]
    ├─ Não → Login / Cadastro
    └─ Sim ↓
        Home / Dashboard
            ├─ Menu hambúrguer → Mesas / Dados / Fichas / Grimório / Calendário / ...
            └─ Ícone de perfil → Meu Perfil → Configurações
```

---

*Documento gerado para a entrega da Atividade 04 — Fase 1 do RollCore.*
