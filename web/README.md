# RollCore Web

Cliente web em React 18, TypeScript e Vite.

## Como rodar

### Pré-requisitos
- Node.js 20 ou superior e npm
- A API rodando (veja `api/README.md`; em desenvolvimento usa `http://localhost:8080`)

### Passos
```bash
cd web
npm install
cp .env.example .env.local     # no PowerShell: Copy-Item .env.example .env.local
npm run dev
```
Abra http://localhost:5173.

## Variáveis (`.env.local`)

| Variável | Padrão | Uso |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080` | URL da API |
| `VITE_GOOGLE_CLIENT_ID` | vazio | Login com Google (vazio esconde o botão) |

## Outros comandos
- `npm run build`: checa os tipos e gera `dist/`
- `npx playwright test`: testes E2E (precisam da API local no ar)
