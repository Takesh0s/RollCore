# RollCore Mobile

App Expo (React Native, SDK 58) para Android e iOS. Usa expo-router.
No pacote de entrega esta pasta se chama `app/`.

## Como rodar

### Pré-requisitos
- Node.js 22.13 ou superior (ou 24.3+/26+) e npm
- Android Studio com um emulador (ex.: Pixel 8 Pro) **ou** o app Expo Go instalado pela loja (Play Store/App Store), que já abre projetos SDK 58
- A API acessível (veja `api/README.md`)

### Passos
```bash
cd mobile   # no pacote de entrega: cd app
npm install
cp .env.example .env           # no PowerShell: Copy-Item .env.example .env
npx expo start
```
No terminal do Expo, pressione `a` para abrir no emulador Android, ou leia o QR code com o Expo Go.

### Endereço da API (`.env`)

| Onde o app roda | `EXPO_PUBLIC_API_URL` |
|---|---|
| Emulador Android, API no seu PC | `http://10.0.2.2:8080` |
| Celular na mesma rede Wi-Fi | `http://IP-DO-SEU-PC:8080` |
| API publicada | `https://rollcore-api.onrender.com` |

Reinicie o `npx expo start` depois de mudar o `.env`.

O login com Google só funciona em build de desenvolvimento, não no Expo Go. Sem as variáveis `EXPO_PUBLIC_GOOGLE_*` o botão fica desativado.

## Outros comandos
- `npx tsc --noEmit`: checa os tipos
- `npx expo start --web --port 8099`: roda a versão web para depuração
