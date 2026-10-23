package com.rollcore.dto.response;

import java.util.List;

/**
 * Full table view for a member. {@code inviteCode} is only present for the master
 * and moderators (omitted from the JSON for players).
 */
public record TableDetailResponse(
    TableSummaryResponse   table,
    String                 inviteCode,
    List<MemberResponse>   members,
    MemberSelfResponse     me
) {}
