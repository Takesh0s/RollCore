package com.rollcore.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI 3.0 metadata and JWT Bearer security scheme.
 * Enables testing authenticated endpoints directly from Swagger UI — RNF-06.
 */
@Configuration
@OpenAPIDefinition(
    info = @Info(
        title       = "RollCore API",
        version     = "1.0",
        description = "RPG Skill Checker & Companion — Fase 1 MVP · Equipe 9"
    ),
    security = @SecurityRequirement(name = "bearerAuth")
)
@SecurityScheme(
    name         = "bearerAuth",
    type         = SecuritySchemeType.HTTP,
    scheme       = "bearer",
    bearerFormat = "JWT",
    in           = SecuritySchemeIn.HEADER
)
public class OpenApiConfig {}
