# 🎲 RPG Skill Checker & Companion

Uma plataforma digital multiplataforma para jogadores e mestres de RPG de mesa, focada em **gestão de fichas, rolagem de dados e sessões online em tempo real**.

---

## 📌 Sobre o Projeto

O **RPG Skill Checker & Companion** tem como objetivo centralizar, simplificar e modernizar a experiência de RPG de mesa, oferecendo uma solução unificada em português.

---

## 🚀 Funcionalidades

### 🎭 Personagens
- Criação e edição de fichas digitais (D&D 5e)
- Cálculo automático de atributos, CA, HP e proficiências

### 🎲 Rolagem de Dados
- Suporte a fórmulas (ex: `2d6+3`)
- Histórico de rolagens

### 🌐 Sessões Online
- Salas em tempo real
- Código de acesso
- Rolagens compartilhadas

---

## 🧩 Arquitetura

O sistema segue uma arquitetura moderna, modular e escalável:

```
Frontend (Web)        → React + TypeScript
Frontend (Mobile)     → React Native (Expo)
Backend (API/BFF)     → Spring Boot (Java 21)
Banco de Dados        → PostgreSQL
Cache / Sessões       → Redis
Tempo Real            → WebSocket (STOMP)
Containerização       → Docker
```

---

## ▶️ Como Executar o Projeto

### 1. Clonar o repositório
```bash
git clone <url-do-repositorio>
cd <nome-do-projeto>
```

### 2. Subir serviços com Docker
```bash
docker-compose up -d
```

### 3. Backend
```bash
cd backend
./mvnw spring-boot:run
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. Mobile
```bash
cd mobile
npm install
npx expo start
```