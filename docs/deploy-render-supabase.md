# Deploy gratuito: API no Render + banco no Supabase + app Android (APK)

## 1. Banco (Supabase)
1. Crie um projeto em supabase.com (plano Free) e guarde a senha do banco.
2. Em **Connect → Session pooler**, copie host, porta (5432) e usuário (`postgres.<ref-do-projeto>`).
   Use o *Session pooler*: o Render free só tem IPv4 e a conexão direta do Supabase é IPv6.
3. Monte a URL JDBC: `jdbc:postgresql://<host-do-pooler>:5432/postgres?sslmode=require`.
   O Flyway cria as tabelas sozinho na primeira subida da API.

## 2. API (Render)
1. Em render.com, **New → Blueprint** e aponte para o repositório (usa o `render.yaml`).
2. Preencha as variáveis marcadas como `sync: false`:
   - `SPRING_DATASOURCE_URL` (passo 1.3), `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`
   - `JWT_SECRET`: texto aleatório com **32+ caracteres** (ex.: `[Convert]::ToBase64String((1..48 | % { Get-Random -Max 256 }) -as [byte[]])`)
   - `E2E_CLEANUP_ENABLED` deve ficar `false`.
   - `CORS_ORIGINS`: inclua o site web (Vercel). O APK nativo não usa CORS.
3. Quando subir, confira nos logs `now at version v7` e `Started RollcoreApplication`.
4. Teste: `Invoke-RestMethod https://<servico>.onrender.com/actuator/health` → `status: UP`.
5. `DELETE /auth/deleteall` deve responder 403/404 em produção.

### Evitar o "sono" do plano grátis
O serviço dorme após ~15 min sem requisições e a primeira chamada leva ~50 s.
Crie um monitor gratuito (UptimeRobot ou cron-job.org) chamando
`https://<servico>.onrender.com/actuator/health` a cada 5–10 minutos.
Antes de uma apresentação, abra esse link ~2 minutos antes. O app mostra
"Acordando o servidor…" quando a resposta demora.

## 3. App Android (APK)
1. Em `mobile/eas.json`, no perfil `preview`, aponte o app para a API:
   ```json
   "preview": {
     "distribution": "internal",
     "android": { "buildType": "apk" },
     "env": { "EXPO_PUBLIC_API_URL": "https://<servico>.onrender.com" }
   }
   ```
2. `cd mobile; eas build -p android --profile preview` e instale o `.apk` pelo link/QR.
3. Para desenvolver contra a API local, copie `mobile/.env.example` para `mobile/.env`.
   Emulador Android usa `http://10.0.2.2:8080`.
   Atenção: o APK de produção só conversa com **HTTPS**; HTTP em texto puro só funciona em build de desenvolvimento.

## Limites conhecidos
- Foto de perfil e capa da mesa escolhidas da galeria ficam só no aparelho (a API aceita apenas URL).
- Apelido editado no Perfil fica só no aparelho (ainda não há endpoint de perfil).
- "Próxima sessão" mostra "A definir" até existir o calendário na API.
- Recuperação de senha e login com Google continuam sem backend.
