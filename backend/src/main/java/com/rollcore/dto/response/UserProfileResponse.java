package com.rollcore.dto.response;

import java.util.UUID;

/**
 * The signed-in user's account summary.
 *
 * @param tablesUsed  tables whose plan quota this user is consuming
 * @param avatarUrl   profile photo, or {@code null}
 * @param tablesLimit table quota of the plan, or {@code null} when effectively unlimited (PREMIUM)
 */
public record UserProfileResponse(
    UUID    userId,
    String  username,
    String  email,
    String  plan,
    int     tablesUsed,
    Integer tablesLimit,
    String  avatarUrl
) {
    /** Compatibility constructor for callers that do not carry an avatar. */
    public UserProfileResponse(UUID userId, String username, String email, String plan,
                               int tablesUsed, Integer tablesLimit) {
        this(userId, username, email, plan, tablesUsed, tablesLimit, null);
    }
}
