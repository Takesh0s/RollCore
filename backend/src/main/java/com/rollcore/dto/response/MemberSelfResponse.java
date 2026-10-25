package com.rollcore.dto.response;

import com.rollcore.entity.GameTableMember;

/** The caller's own membership, including private settings. */
public record MemberSelfResponse(
    String  displayName,
    String  avatarUrl,
    boolean muted,
    String  role
) {
    public static MemberSelfResponse from(GameTableMember m) {
        return new MemberSelfResponse(
            m.getDisplayName(), m.getAvatarUrl(), m.isMuted(), m.getRole().name());
    }
}
