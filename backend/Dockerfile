# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Build
# Maven + JDK 21 on Alpine for a minimal build image
# ─────────────────────────────────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build

WORKDIR /build

# Cache dependencies before copying source — layer-efficient
COPY pom.xml .
RUN mvn dependency:go-offline -q

COPY src ./src
# Skip tests here; tests run in CI (GitHub Actions) — Arquitetura §7
RUN mvn package -DskipTests -q

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Runtime
# Minimal JRE 21 image; non-root user; no shell tools
# ─────────────────────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Non-root user for container security — RNF-03
RUN addgroup -S rollcore && adduser -S rollcore -G rollcore
USER rollcore

COPY --from=build /build/target/rollcore-backend-*.jar app.jar

# Spring Boot virtual threads + Tomcat need this env flag
ENV JAVA_OPTS="-XX:+UseG1GC -Xmx512m -Xms256m"

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -qO- http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]