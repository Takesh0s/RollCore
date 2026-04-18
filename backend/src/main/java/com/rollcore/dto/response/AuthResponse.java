package com.rollcore.dto.response;

import java.util.UUID;

/**
 * Successful authentication payload returned by register, login, and refresh.
 * UC-01 §3.1 / §4 (Pós-condições).
 */
public record AuthResponse(
    String  accessToken,
    String  refreshToken,
    UUID    userId,
    String  email,
    String  username
) {}
