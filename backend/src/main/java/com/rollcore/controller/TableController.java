package com.rollcore.controller;

import com.rollcore.dto.request.ChangeRoleRequest;
import com.rollcore.dto.request.CreateTableRequest;
import com.rollcore.dto.request.JoinTableRequest;
import com.rollcore.dto.request.TransferHostRequest;
import com.rollcore.dto.request.UpdateMemberProfileRequest;
import com.rollcore.dto.request.UpdateTableRequest;
import com.rollcore.dto.response.InviteCodeResponse;
import com.rollcore.dto.response.MemberResponse;
import com.rollcore.dto.response.MemberSelfResponse;
import com.rollcore.dto.response.TableDetailResponse;
import com.rollcore.dto.response.TablePreviewResponse;
import com.rollcore.dto.response.TableSummaryResponse;
import com.rollcore.service.TableService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Game tables ("mesas") — Fase 2a.
 *
 * <pre>
 * POST   /tables                              → create (caller becomes MASTER)
 * GET    /tables                              → my tables
 * GET    /tables/{id}                         → table detail (members only)
 * PUT    /tables/{id}                         → edit (master)
 * DELETE /tables/{id}                         → delete (master)
 * GET    /tables/preview/{inviteCode}         → public info before joining
 * POST   /tables/join                         → join with invite code
 * POST   /tables/{id}/invite-code             → regenerate invite code (master)
 * PATCH  /tables/{id}/members/me              → my per-table profile
 * DELETE /tables/{id}/members/me              → leave the table
 * DELETE /tables/{id}/members/{userId}        → remove a member (master / moderator)
 * PATCH  /tables/{id}/members/{userId}/role   → promote / demote (master)
 * POST   /tables/{id}/transfer-host           → hand the hosting to a member (paid plan sponsor)
 * </pre>
 *
 * All endpoints require a valid access token; the user id comes from the security
 * context, never from the request body.
 */
@Tag(name = "Tables", description = "Game tables (mesas) and membership — Fase 2a")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/tables")
@RequiredArgsConstructor
public class TableController {

    private final TableService tableService;

    @Operation(summary = "Create a table; the caller becomes its master")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TableDetailResponse create(
            @Valid @RequestBody CreateTableRequest request,
            @AuthenticationPrincipal UUID userId) {
        return tableService.create(userId, request);
    }

    @Operation(summary = "List the tables the caller belongs to")
    @GetMapping
    public List<TableSummaryResponse> list(@AuthenticationPrincipal UUID userId) {
        return tableService.list(userId);
    }

    @Operation(summary = "Public overview of a table by invite code (before joining)")
    @GetMapping("/preview/{inviteCode}")
    public TablePreviewResponse preview(@PathVariable String inviteCode) {
        return tableService.preview(inviteCode);
    }

    @Operation(summary = "Join a table with an invite code")
    @PostMapping("/join")
    @ResponseStatus(HttpStatus.CREATED)
    public TableDetailResponse join(
            @Valid @RequestBody JoinTableRequest request,
            @AuthenticationPrincipal UUID userId) {
        return tableService.join(userId, request);
    }

    @Operation(summary = "Table detail (members only)")
    @GetMapping("/{id}")
    public TableDetailResponse get(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        return tableService.get(id, userId);
    }

    @Operation(summary = "Edit a table — master only (full replacement)")
    @PutMapping("/{id}")
    public TableDetailResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTableRequest request,
            @AuthenticationPrincipal UUID userId) {
        return tableService.update(id, userId, request);
    }

    @Operation(summary = "Delete a table — master only")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        tableService.delete(id, userId);
    }

    @Operation(summary = "Regenerate the invite code — master only (invalidates the old one)")
    @PostMapping("/{id}/invite-code")
    public InviteCodeResponse regenerateInviteCode(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        return new InviteCodeResponse(tableService.regenerateInviteCode(id, userId));
    }

    @Operation(summary = "Hand the hosting (master role) to another member — paid plan, table creator only")
    @PostMapping("/{id}/transfer-host")
    public TableDetailResponse transferHost(
            @PathVariable UUID id,
            @Valid @RequestBody TransferHostRequest body,
            @AuthenticationPrincipal UUID userId) {
        return tableService.transferHost(id, userId, body.userId());
    }

    @Operation(summary = "Update my per-table profile (display name, avatar, mute)")
    @PatchMapping("/{id}/members/me")
    public MemberSelfResponse updateMyProfile(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMemberProfileRequest request,
            @AuthenticationPrincipal UUID userId) {
        return tableService.updateMyProfile(id, userId, request);
    }

    @Operation(summary = "Leave the table (the master cannot leave)")
    @DeleteMapping("/{id}/members/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void leave(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        tableService.leave(id, userId);
    }

    @Operation(summary = "Remove a member — master or moderator")
    @DeleteMapping("/{id}/members/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMember(
            @PathVariable UUID id,
            @PathVariable("userId") UUID targetUserId,
            @AuthenticationPrincipal UUID actorId) {
        tableService.removeMember(id, actorId, targetUserId);
    }

    @Operation(summary = "Promote to moderator or demote to player — master only")
    @PatchMapping("/{id}/members/{userId}/role")
    public MemberResponse changeRole(
            @PathVariable UUID id,
            @PathVariable("userId") UUID targetUserId,
            @Valid @RequestBody ChangeRoleRequest request,
            @AuthenticationPrincipal UUID actorId) {
        return tableService.changeRole(id, actorId, targetUserId, request);
    }
}
