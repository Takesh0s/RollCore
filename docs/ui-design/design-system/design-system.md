# Design System — RollCore

## Visão Geral

O RollCore utiliza uma identidade visual temática medieval/fantasia, com paleta escura de tons vinho e dourado, tipografia estilizada com influência de manuscritos antigos, e componentes que reforçam a atmosfera de RPG de mesa.

---

## 1. Identidade Visual

### 1.1 Conceito
A interface remete a pergaminhos, grimórios e tavernas medievais. O uso de bordas douradas sobre fundos vinho escuro cria contraste elegante, enquanto botões com brilho suave (glow) dão a sensação de magia e poder.

### 1.2 Logo
- **Símbolo:** Ícone de d20 (icosaedro) estilizado dentro de um hexágono, desenhado com linhas douradas finas
- **Tipografia do nome:** `RollCore` em fonte display com serifas geométricas (estilo manuscrito medieval)
- **Variantes:** logo completo (símbolo + nome), símbolo isolado

---

## 2. Paleta de Cores

### 2.1 Cores Primárias

| Nome | Hex | Uso |
|---|---|---|
| Vinho Escuro | `#5C0A0A` | Background principal (tela e card) |
| Vinho Médio | `#7A1010` | Superfícies secundárias, cards internos |
| Vinho Suave | `#8C1A1A` | Hover states, seções separadas |
| Dourado Principal | `#C8963E` | Textos em destaque, títulos, ícones, bordas |
| Dourado Claro | `#E8B86D` | Texto de labels, ícones secundários |
| Dourado Escuro | `#8A6220` | Bordas sutis, elementos em repouso |

### 2.2 Cores de Feedback

| Nome | Hex | Uso |
|---|---|---|
| Sucesso / Disponível | `#2E7D32` (verde) | Dot indicador de item equipado/disponível |
| Neutro / Indisponível | `#5D4037` (marrom) | Dot indicador de item indisponível |
| Sucesso Crítico | `#00C853` (verde vivo) | Texto de resultado de dado crítico |
| Dano / Alerta | `#FF5252` (vermelho) | Barra de HP crítica, Excluir Conta |
| HP Bar — Cheio | `#2196F3` (azul) | Segmento esquerdo da barra de vida |
| HP Bar — Atual | `#4CAF50` (verde) | Segmento central da barra de vida |

### 2.3 Fundo Externo (Desktop)

| Nome | Hex | Uso |
|---|---|---|
| Marrom Neutro | `#7A6040` | Background de página no layout PC (fora do card central) |

---

## 3. Tipografia

### 3.1 Fontes

| Tipo | Fonte | Uso |
|---|---|---|
| Display (títulos principais) | Fonte medieval/rúnica customizada (estilo manuscrito, serifas geométricas) | Nome "RollCore", títulos de telas principais (Mesas, Fichas, Dados, Grimório...) |
| Corpo / Interface | Sans-serif do sistema (sem serifa, peso normal) | Labels, campos, textos de descrição, conteúdo geral |

> **Nota:** A fonte display é a identidade central do app. Deve ser usada somente em títulos de seção e no logotipo — nunca em campos de formulário ou textos longos.

### 3.2 Hierarquia de Tamanhos

| Nível | Tamanho | Peso | Cor | Uso |
|---|---|---|---|---|
| Display | ~32–40px | Normal | Dourado Principal | Nome do app, títulos de tela (fonte medieval) |
| H1 | 22–26px | Medium | Dourado Principal | Títulos de seção (Mesas, Fichas...) |
| H2 | 16–18px | Medium | Dourado Claro | Sub-seções (Truques, Magias de nível 1...) |
| Body | 14–16px | Normal | Branco / Off-white | Texto de conteúdo geral |
| Label | 12–14px | Normal | Dourado Claro | Labels de campos, legendas |
| Caption | 11–12px | Normal | Dourado Escuro / Cinza | Datas, informações secundárias |

---

## 4. Componentes

### 4.1 Botão Principal (CTA)

- **Fundo:** `#3D1A0A` (marrom escuro)
- **Borda:** arredondada (border-radius: 24px)
- **Texto:** Dourado, itálico, peso bold
- **Efeito:** brilho/glow dourado-laranja ao redor do botão (box-shadow radial)
- **Exemplos:** "Entrar", "Criar conta", "Salvar alterações", "Rolar Dados"

```
┌─────────────────────────────┐  ← borda arredondada
│         *Entrar*            │  ← texto itálico dourado
└─────────────────────────────┘
        ░░░░░░░░░             ← glow laranja-dourado
```

### 4.2 Botão Secundário

- **Fundo:** `#3D1A0A` semi-transparente
- **Borda:** `1px solid` Dourado Escuro, border-radius moderado
- **Texto:** Dourado Claro
- **Exemplos:** "Entrar" (dentro dos cartões de mesa), "Editar", "Adicionar", "Adicionar magias"

### 4.3 Link de Texto

- **Estilo:** sublinhado
- **Cor:** Dourado Claro
- **Exemplos:** "criar conta", "Já tenho conta", "Usar conta existente"

### 4.4 Campo de Input

- **Fundo:** `#5C2A10` (marrom-avermelhado médio)
- **Borda:** sem borda visível (integrado ao fundo)
- **Border-radius:** 8px
- **Texto:** Dourado Claro
- **Placeholder:** texto dourado mais escuro/suave
- **Altura:** ~48–54px

### 4.5 Select / Dropdown

- **Estilo visual:** similar ao input, com ícone `∨` dourado
- **Fundo destacado:** dourado claro com texto escuro (quando ativo/selecionado)
- **Exemplos:** Raça, Classe, Subclasse, Sistema, Idioma, Tamanho de Fonte, Tema

### 4.6 Toggle Switch

- **Estado ativo:** bolinha à direita, fundo dourado/amarelado
- **Estado inativo:** bolinha à esquerda, fundo marrom
- **Exemplos:** Notificações, Modo Daltônico

### 4.7 Checkbox

- **Estilo:** quadrado com borda clara, sem preenchimento quando vazio
- **Exemplos:** "Mantenha conectado"

### 4.8 Card de Mesa

```
┌──────────────────────────────────┐
│ [Imagem de capa — full width]    │
│ "Nome da campanha"               │  ← overlay de texto no topo
│              [  Entrar  ]        │  ← botão centralizado
└──────────────────────────────────┘
         [  Editar  ]              ← botão abaixo do card (visível para mestre)
```

- **Border-radius:** 8px
- **Imagem:** ocupa 100% do card
- **Overlay de texto:** sobre a imagem, canto superior esquerdo
- **Espaçamento entre cards:** 16px

### 4.9 Item de Ficha (Lista)

```
┌────────────────────────────────────────────┐
│ [Avatar circular] Nome do personagem [Editar] │
└────────────────────────────────────────────┘
```

- **Avatar:** circular, ~64px, com imagem do personagem
- **Separador:** linha fina dourada entre itens

### 4.10 Tabela de Inventário

| Coluna | Largura | Alinhamento |
|---|---|---|
| Equipado (✔/✗) | fixo pequeno | Centro |
| Disponível (dot) | fixo pequeno | Centro |
| Nome | flex | Esquerda |
| Dano/AC | fixo médio | Esquerda |
| Quantidade | fixo pequeno | Centro |

- **Cabeçalho:** fundo vinho escuro, texto dourado, peso bold
- **Linhas:** alternância sutil de opacidade
- **Quantidade:** campo numérico editável com fundo dourado

### 4.11 Barra de Pontos de Vida

```
[████████░░░░░░░░░░░░░░░░░] 32/25
```

- **Segmento azul:** HP atual até o máximo "normal"
- **Segmento verde:** zona saudável
- **Segmento vermelho:** zona crítica (quando HP < 30%)
- **Texto central:** "HP atual / HP máximo" em branco

### 4.12 Escudo de Classe de Armadura

- **Forma:** escudo SVG dourado
- **Número:** centralizado, fonte bold grande
- **Exemplo:** `19`

### 4.13 Barra de Histórico de Dados

```
┌───────────────────────────────────┐
│ 3d6 → [1, 6, 6]                  │
│ 30/04/2026 23:33             [13] │
└───────────────────────────────────┘
```

- Texto de expressão: branco
- Data: caption dourado escuro
- Resultado: número grande, dourado, canto direito

---

## 5. Iconografia

### 5.1 Estilo
- Linha (outline), espessura uniforme
- Cor: Dourado Principal
- Sem preenchimento (exceto estados ativos)

### 5.2 Ícones Principais

| Ícone | Seção |
|---|---|
| Pergaminho | Mesas |
| D20 (icosaedro) | Dados / Logo |
| Folhas sobrepostas | Fichas |
| Sino | Notificações |
| Casa | Início |
| Livro aberto | Criação de Mapas |
| Calendário | Calendário |
| Pilha de livros | Sistemas |
| Bola de cristal | Grimório |
| Tela com `...` | Tutoriais |
| D20 pequeno | Créditos |
| Engrenagem | Configurações |
| Pessoa (silhueta) | Perfil |
| Hambúrguer (≡) | Menu lateral |
| Funil | Filtro |
| Pena | Editar nome (ficha) |
| Seta esquerda `←` | Voltar |

### 5.3 Dados (Rolador)
Cada tipo de dado tem um ícone geométrico próprio:
- `d4` → triângulo
- `d6` → quadrado
- `d8` → octógono
- `d10` → decágono
- `d12` → dodecágono
- `d20` → círculo com icosaedro
- `d?` → símbolo `?`

---

## 6. Layout e Espaçamento

### 6.1 Estrutura Geral (Mobile)

```
┌─────────────────────────────┐
│ [≡]    Título     [👤]      │  ← Header (fixed)
├─────────────────────────────┤
│                             │
│         Conteúdo            │  ← Scroll area
│                             │
├─────────────────────────────┤
│  [⬛]  [⬛]  [⬛]  [⬛]    │  ← Bottom nav (fixed)
└─────────────────────────────┘
```

### 6.2 Estrutura Geral (Desktop)

O app no PC é exibido como um card centralizado (simulando proporções mobile), com o fundo de página em marrom neutro (`#7A6040`). A navegação é a mesma — não há layout de duas colunas.

### 6.3 Grid e Espaçamento

| Tipo | Valor |
|---|---|
| Padding lateral (mobile) | 16px |
| Padding interno de card | 16–24px |
| Gap entre seções | 24px |
| Gap entre itens de lista | 8–12px |
| Gap entre botões | 12px |

### 6.4 Border Radius

| Elemento | Raio |
|---|---|
| Inputs e selects | 8px |
| Botões CTA | 24px (pílula) |
| Botões secundários | 16px |
| Cards | 8–12px |
| Avatar | 50% (circular) |
| Container principal | 12px |
| Borda dourada do container | Thin (1–2px), rect arredondado |

---

## 7. Borda Dourada do Container

Um dos elementos visuais mais marcantes do RollCore é a **borda interna dourada** que envolve toda a área de conteúdo do app, reforçando a estética de pergaminho/moldura de grimório.

- **Cor:** Dourado Escuro / Dourado Principal
- **Espessura:** 1–2px
- **Tipo:** `border` ou `outline` retangular com border-radius suave
- **Comportamento:** presente em todas as telas, estática (não rola com o conteúdo)

---

## 8. Acessibilidade

| Recurso | Descrição |
|---|---|
| Modo Daltônico | Ajusta paleta para melhor distinção de cores (configurável em Settings) |
| Tamanho de Fonte | Seletor de tamanho (10px, 12px, 14px, 16px) em Settings |
| Contraste | Fundo escuro + texto dourado mantém contraste adequado na maioria dos casos |

---

## 9. Temas

O app suporta seleção de tema via Settings:

| Tema | Descrição |
|---|---|
| Medieval (padrão) | Paleta vinho + dourado, fontes estilizadas, bordas de grimório |
| *(Futuros temas)* | Fase 2+ |

Adicionalmente, o usuário pode personalizar as **cores de destaque** via seletor (predefinidas + picker custom).

---

## 10. Animações e Efeitos

| Elemento | Efeito |
|---|---|
| Botões CTA | Glow dourado-laranja (box-shadow) |
| Botão Entrar (hover/press) | Leve aumento de brilho |
| Menu hambúrguer | Slide-in lateral |
| Dados (rolagem) | Animação de rotação do d20 ao rolar (aguardando implementação) |

---

*Documento gerado para a entrega da Atividade 04 — Fase 1 do RollCore.*
