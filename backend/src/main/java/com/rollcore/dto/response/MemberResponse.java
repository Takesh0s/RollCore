package com.rollcore.dto.response;

import com.rollcore.entity.GameTableMember;

import java.time.Instant;
import java.util.UUID;

/** Public view of a table member (never includes private flags such as {@code muted}). */
public record MemberResponse(
    UUID    userId,
    String  username,
    String  displayName,
    String  avatarUrl,
    String  role,
    Instant joinedAt
) {
    public static MemberResponse from(GameTableMember m) {
        return new MemberResponse(
            m.getUser().getId(),
            m.getUser().getUsername(),
            m.getDisplayName(),
            m.getAvatarUrl(),
            m.getRole().name(),
            m.getJoinedAt());
    }
}
