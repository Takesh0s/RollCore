# Contribuindo com o RollCore

O projeto segue o **Git Flow**. Este documento resume o que fazer em cada situação.

## Branches

| Branch | Função |
| --- | --- |
| `main` | Somente código de release. Cada merge recebe uma tag `vX.Y.Z`. |
| `develop` | Integração. É a branch padrão e a base de todo trabalho novo. |
| `feat/*` | Funcionalidade nova. Sai da `develop` e volta para a `develop`. |
| `fix/*` | Correção de bug. Sai da `develop` e volta para a `develop`. |
| `docs/*`, `test/*`, `chore/*`, `ci/*`, `refactor/*` | Mesmo caminho das anteriores, conforme o tipo da mudança. |
| `release/X.Y.Z` | Preparação de uma versão. Sai da `develop` e vai para a `main` e de volta para a `develop`. |
| `hotfix/*` | Correção urgente em produção. Sai da `main` e vai para a `main` e de volta para a `develop`. |

`main` e `develop` são protegidas: não aceitam push direto, e todo merge passa por Pull Request com os checks **Build & Test** e **E2E** verdes.

## Fluxo de uma mudança

```bash
git fetch origin
git checkout develop
git pull origin develop
git checkout -b feat/nome-curto
# trabalhe e faça commits
git push -u origin feat/nome-curto
```

Abra o Pull Request com **base `develop`** e faça o merge com *merge commit* (sem squash), para o histórico mostrar de qual branch cada coisa veio. Depois do merge, apague a branch.

## Release

```bash
git checkout develop
git pull origin develop
git checkout -b release/1.2.0
# ajuste versões e changelog; só correções entram aqui
git push -u origin release/1.2.0
```

1. Abra um PR de `release/1.2.0` para a `main` e faça o merge.
2. Crie a tag na `main`: `git tag -a v1.2.0 -m "RollCore v1.2.0"` e `git push origin v1.2.0`.
3. Abra um PR de `main` para a `develop` para trazer de volta qualquer ajuste feito na release.
4. Apague a branch `release/1.2.0`.

## Hotfix

```bash
git checkout main
git pull origin main
git checkout -b hotfix/descricao-curta
```

Abra o PR para a `main`, faça a tag de correção (`v1.2.1`) e abra outro PR da `main` para a `develop`.

## Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/), com a mensagem em inglês no imperativo:

```
feat(web): edit table and migrate local covers
fix(api): return 400 for unreadable request bodies
docs: describe the branch workflow
```

Tipos: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`. O escopo (`web`, `api`, `mobile`) é opcional.

## Antes de abrir o PR

- Backend: `mvn test` dentro de `backend/`.
- Web: `npx tsc --noEmit` e `npm run build` dentro de `web/`.
- Mobile: `npx tsc --noEmit` dentro de `mobile/`.

Descreva no PR o que mudou, por que mudou e como testar.
