#!/usr/bin/env bash
# =============================================================================
# commitappend.sh — Fix rápido (append commit)
# =============================================================================
echo "COMMIT APPEND RODANDO"

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; RESET='\033[0m'

log()  { echo -e "${CYAN}[commitappend]${RESET} $1"; }
ok()   { echo -e "${GREEN}[ok]${RESET} $1"; }
warn() { echo -e "${YELLOW}[warn]${RESET} $1"; }
err()  { echo -e "${RED}[erro]${RESET} $1"; exit 1; }

command -v git >/dev/null 2>&1 || err "Git não encontrado."

# =============================================================================
log "Verificando alterações..."

if [ -z "$(git status --porcelain)" ]; then
  ok "Nada para commitar."
  exit 0
fi

# =============================================================================
# ADD automático (apenas arquivos modificados e novos)
# =============================================================================
log "Adicionando alterações..."
git add .

# =============================================================================
# COMMIT — padrão fix
# =============================================================================
log "Criando commit..."

git commit \
  -m "fix(test): resolve Character import ambiguity" \
  -m "" \
  -m "- Replace wildcard import (*) with explicit imports" \
  -m "- Avoid conflict with java.lang.Character" \
  -m "- Fix Maven compilation error"

ok "Commit criado."

# =============================================================================
# PUSH com auto-pull (seguro)
# =============================================================================
echo ""
log "Sincronizando com origin/main..."

# tenta pull com rebase antes
if git pull origin main --rebase; then
  ok "Rebase aplicado com sucesso."
else
  err "Falha no git pull --rebase. Resolva conflitos manualmente."
fi

log "Enviando para o GitHub..."

if git push origin main; then
  echo ""
  ok "══════════════════════════════════════"
  ok " Commit enviado com sucesso!"
  ok "══════════════════════════════════════"
else
  err "Falha no push."
fi

# =============================================================================
echo ""
log "Histórico recente:"
git log --oneline -5