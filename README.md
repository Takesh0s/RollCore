# 🎓 Risco de Evasão Acadêmica — ML + Lógica Fuzzy

**Disciplina:** Inteligência Artificial  
**Professor:** William Malvezzi  
**Grupo 2**

**Integrantes:**
- João Pedro Nunes Neto
- Leonardo dos Santos Silva
- Lucas Gabriel Pereira Guerra
- Luis Felipe Nunes da Fonseca Figueiredo
- Luiz Phillipe de Souza Santos

**Prazo de Entrega:** 25 de Junho de 2025

---

## 📋 Descrição do Projeto

Sistema inteligente para estimação de **risco de evasão acadêmica** combinando:

- **Machine Learning** (Árvore de Decisão + Naive Bayes Gaussiano)
- **Lógica Fuzzy** (Sistema de Inferência Mamdani com 8 regras)
- **Integração em Pipeline** — Abordagem B: saída do ML alimenta o sistema Fuzzy

---

## 📁 Estrutura dos Arquivos

```
.
├── evasao_academica_ml_fuzzy.ipynb   ← Notebook principal (Google Colab)
├── base_evasao_academica.csv         ← Base de dados (gerada ao executar)
├── resultados_integracao.csv         ← Resultados do pipeline ML+Fuzzy
├── README.md                         ← Este arquivo
└── *.png                             ← Gráficos gerados automaticamente
```

---

## ▶️ Como Executar no Google Colab

### Opção 1 — Upload direto (recomendado)

1. Acesse [colab.research.google.com](https://colab.research.google.com)
2. Clique em **Arquivo → Fazer upload de notebook**
3. Selecione o arquivo `evasao_academica_ml_fuzzy.ipynb`
4. Clique em **Ambiente de execução → Executar tudo** (`Ctrl+F9`)
5. Aguarde a instalação das dependências (célula 1 instala o `scikit-fuzzy`)

### Opção 2 — Pelo Google Drive

1. Faça upload do `.ipynb` para o Google Drive
2. Clique com o botão direito → **Abrir com → Google Colaboratory**
3. Execute todas as células (`Ctrl+F9`)

---

## 📦 Dependências

Todas as bibliotecas são instaladas automaticamente na **primeira célula** do notebook:

| Biblioteca | Versão testada | Uso |
|---|---|---|
| `numpy` | ≥ 1.24 | Operações numéricas |
| `pandas` | ≥ 1.5 | Manipulação de dados |
| `matplotlib` | ≥ 3.6 | Visualizações |
| `seaborn` | ≥ 0.12 | Gráficos estatísticos |
| `scikit-learn` | ≥ 1.2 | Machine Learning |
| `scikit-fuzzy` | ≥ 0.4 | Sistema fuzzy (**instalado via pip**) |

> ⚠️ O `scikit-fuzzy` não vem pré-instalado no Colab.  
> A primeira célula executa `!pip install scikit-fuzzy --quiet` automaticamente.

---

## 🏗️ Arquitetura do Sistema

```
[Dados Brutos (6 variáveis)]
         │
         ▼
[Pré-processamento]
  ├── Normalização (StandardScaler)
  └── Divisão Treino/Teste 70/30 estratificado
         │
         ▼
[PARTE 1 — Machine Learning]
  ├── Árvore de Decisão (max_depth=6, Gini)
  └── Naive Bayes Gaussiano
         │
         ▼ predict_proba → prob_evasao_alto
         │
         ▼
[PARTE 2 — Sistema Fuzzy Mamdani]
  Entradas:
    ├── prob_evasao_ml  (0–1)       ← saída do ML
    ├── frequencia      (0–100%)    ← dado original
    └── engajamento_ava (0–30)      ← dado original
  Saída:
    └── risco_final (score 0–100 + rótulo: baixo/médio/alto/crítico)
         │
         ▼
[PARTE 3 — Análise de Coerência ML ↔ Fuzzy]
  └── Concordância, tabela cruzada, visualizações
```

---

## 📊 Resultados Esperados

| Métrica | Árvore de Decisão | Naive Bayes |
|---|---|---|
| Acurácia (teste) | ~84% | ~92% |
| F1-score (macro) | ~0.84 | ~0.92 |
| CV F1 (5-fold) | ~0.80 ± 0.04 | ~0.93 ± 0.02 |

| Integração ML+Fuzzy | Valor |
|---|---|
| Concordância ML ↔ Fuzzy | ~82% |
| Score médio — alto risco | ~72/100 |
| Score médio — baixo risco | ~18/100 |

---

## 📐 Sistema Fuzzy — Regras Implementadas

| Regra | Condição SE | Consequente ENTÃO |
|---|---|---|
| R1 | prob_alta E freq_baixa | risco CRÍTICO |
| R2 | prob_alta E eng_baixo | risco CRÍTICO |
| R3 | prob_alta E freq_média | risco ALTO |
| R4 | prob_média E freq_baixa | risco ALTO |
| R5 | prob_média E eng_médio | risco MÉDIO |
| R6 | prob_média E freq_alta E eng_médio | risco MÉDIO |
| R7 | prob_baixa E freq_alta | risco BAIXO |
| R8 | prob_baixa E eng_alto | risco BAIXO |

---

## 📤 Entregáveis para o AVA

- [x] `evasao_academica_ml_fuzzy.ipynb` — Notebook com código completo e comentado
- [x] `base_evasao_academica.csv` — Base de dados (gerada ao executar o notebook)
- [x] `README.md` — Este arquivo com instruções
- [ ] Relatório final em PDF (10–20 páginas) — elaborar com base no notebook
- [ ] Apresentação (PDF ou PPTX) — usar os gráficos gerados

---

## ⚠️ Observações Importantes

1. **Reprodutibilidade:** `random_state=42` garante resultados idênticos em cada execução
2. **Ordem das células:** execute sempre do início ao fim (`Ctrl+F9`)
3. **Base de dados:** gerada automaticamente na célula 3 — não precisa de upload externo
4. **Gráficos:** salvos automaticamente como `.png` no mesmo diretório

---

*Trabalho elaborado para a disciplina de Inteligência Artificial — Prof. William Malvezzi — 2025*
