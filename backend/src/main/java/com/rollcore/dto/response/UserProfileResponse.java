package com.rollcore.dto.response;

import java.util.UUID;

/**
 * The signed-in user's account summary.
 *
 * @param tablesUsed  tables whose plan quota this user is consuming
 * @param tablesLimit table quota of the plan, or {@code null} when effectively unlimited (PREMIUM)
 */
public record UserProfileResponse(
    UUID    userId,
    String  username,
    String  email,
    String  plan,
    int     tablesUsed,
    Integer tablesLimit
) {}
