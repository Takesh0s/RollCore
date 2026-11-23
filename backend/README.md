# RollCore API

API REST em Spring Boot 3.2 (Java 21) com PostgreSQL 16, Flyway e JWT.
No pacote de entrega esta pasta se chama `api/`.

## Como rodar

### Pré-requisitos
- Java 21 (JDK)
- Docker e Docker Compose (para o PostgreSQL), ou um PostgreSQL 16 próprio

### Opção 1: tudo com Docker (mais simples)
Na raiz do projeto (onde está `docker-compose.yml`):

```bash
docker compose up -d --build
```

A API sobe em http://localhost:8080 (Swagger em `/swagger-ui.html`, saúde em `/actuator/health`).

### Opção 2: banco no Docker e API pelo Maven
```bash
docker compose up -d db
export JWT_SECRET="troque-por-um-segredo-com-pelo-menos-32-caracteres!!"
./mvnw -f backend/pom.xml spring-boot:run     # no pacote de entrega: -f api/pom.xml
```
No PowerShell: `$env:JWT_SECRET="..."` e `.\mvnw.cmd -f backend/pom.xml spring-boot:run`.

## Variáveis de ambiente

| Variável | Obrigatória | Padrão | Uso |
|---|---|---|---|
| `JWT_SECRET` | sim | nenhum | Segredo de assinatura dos tokens (a API não inicia sem ele) |
| `SPRING_DATASOURCE_URL` | não | `jdbc:postgresql://localhost:5432/rollcore` | Banco |
| `SPRING_DATASOURCE_USERNAME` / `PASSWORD` | não | `rollcore` / `rollcore` | Credenciais |
| `CORS_ORIGINS` | não | origens locais | Origens permitidas |
| `GOOGLE_CLIENT_ID` | não | vazio | Login com Google |

As migrações do banco (Flyway) rodam sozinhas na inicialização.

## Testes
```bash
./mvnw -f backend/pom.xml test
```
