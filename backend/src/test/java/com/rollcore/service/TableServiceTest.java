package com.rollcore.service;

import com.rollcore.dto.request.ChangeRoleRequest;
import com.rollcore.dto.request.CreateTableRequest;
import com.rollcore.dto.request.JoinTableRequest;
import com.rollcore.dto.request.UpdateMemberProfileRequest;
import com.rollcore.dto.request.UpdateTableRequest;
import com.rollcore.dto.response.MemberResponse;
import com.rollcore.dto.response.MemberSelfResponse;
import com.rollcore.dto.response.TableDetailResponse;
import com.rollcore.dto.response.TablePreviewResponse;
import com.rollcore.entity.GameTable;
import com.rollcore.entity.GameTableMember;
import com.rollcore.entity.GameTableMember.Role;
import com.rollcore.entity.User;
import com.rollcore.exception.ConflictException;
import com.rollcore.exception.ForbiddenException;
import com.rollcore.exception.NotFoundException;
import com.rollcore.repository.GameTableMemberRepository;
import com.rollcore.repository.GameTableRepository;
import com.rollcore.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TableService — mesas, convites e papéis")
class TableServiceTest {

    @Mock GameTableRepository       tables;
    @Mock GameTableMemberRepository members;
    @Mock UserRepository            users;

    private TableService service;

    private final UUID masterId = UUID.randomUUID();
    private final UUID modId    = UUID.randomUUID();
    private final UUID playerId = UUID.randomUUID();
    private final UUID tableId  = UUID.randomUUID();

    private User master, moderator, player;
    private GameTable table;
    private GameTableMember masterM, modM, playerM;

    @BeforeEach
    void setUp() {
        service = new TableService(tables, members, users, 1, 3);

        master    = user(masterId, "gm");
        moderator = user(modId, "mod");
        player    = user(playerId, "ply");

        table = GameTable.builder()
                .id(tableId).owner(master).name("Em busca dos esquecidos")
                .gameSystem("D&D 5e").maxPlayers(5).inviteCode("ABCD2345")
                .createdAt(Instant.now()).build();

        masterM = member(master, Role.MASTER);
        modM    = member(moderator, Role.MODERATOR);
        playerM = member(player, Role.PLAYER);
    }

    private static User user(UUID id, String name) {
        return User.builder().id(id).username(name).email(name + "@x.com").passwordHash("h").build();
    }

    private GameTableMember member(User u, Role role) {
        return GameTableMember.builder()
                .id(UUID.randomUUID()).gameTable(table).user(u).role(role)
                .joinedAt(Instant.now()).build();
    }

    /** Stubs the caller's membership lookup. */
    private void asMember(GameTableMember m) {
        when(members.findByGameTableIdAndUserId(tableId, m.getUser().getId())).thenReturn(Optional.of(m));
    }

    private void stubMembersList(GameTableMember... all) {
        when(members.findByGameTableIdOrderByJoinedAtAsc(tableId)).thenReturn(new ArrayList<>(List.of(all)));
    }

    // ── create ────────────────────────────────────────────────────────────────

    @Nested @DisplayName("create()")
    class CreateTest {

        @Test @DisplayName("creates the table, makes the caller MASTER and applies defaults")
        void createsWithDefaults() {
            when(users.findById(masterId)).thenReturn(Optional.of(master));
            when(tables.countBySponsorId(masterId)).thenReturn(0L);
            when(tables.existsByInviteCode(any())).thenReturn(false);
            when(tables.save(any(GameTable.class))).thenAnswer(inv -> {
                GameTable t = inv.getArgument(0);
                t.setId(tableId);
                return t;
            });
            AtomicReference<GameTableMember> saved = new AtomicReference<>();
            when(members.save(any(GameTableMember.class))).thenAnswer(inv -> {
                GameTableMember m = inv.getArgument(0);
                m.setJoinedAt(Instant.now());
                saved.set(m);
                return m;
            });
            when(members.findByGameTableIdOrderByJoinedAtAsc(tableId))
                    .thenAnswer(inv -> List.of(saved.get()));

            TableDetailResponse r = service.create(masterId,
                    new CreateTableRequest("  Minha Mesa  ", null, null, null, null));

            assertThat(r.table().name()).isEqualTo("Minha Mesa");
            assertThat(r.table().gameSystem()).isEqualTo("D&D 5e");
            assertThat(r.table().maxPlayers()).isEqualTo(5);
            assertThat(r.table().myRole()).isEqualTo("MASTER");
            assertThat(r.table().playerCount()).isEqualTo(1);
            assertThat(r.inviteCode()).hasSize(8).matches("[A-HJ-NP-Z2-9]{8}");
            assertThat(r.me().role()).isEqualTo("MASTER");
        }

        @Test @DisplayName("FREE plan: rejects a second table (1 at a time)")
        void freePlanRejectsSecondTable() {
            when(users.findById(masterId)).thenReturn(Optional.of(master));
            when(tables.countBySponsorId(masterId)).thenReturn(1L);

            assertThatThrownBy(() -> service.create(masterId,
                    new CreateTableRequest("Mesa", null, null, null, null)))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("free plan");

            verify(tables, never()).save(any());
        }

        @Test @DisplayName("PREMIUM plan: creates beyond the free quota and sponsors the table")
        void premiumPlanCreatesManyAndSponsors() {
            master.setPlan(User.Plan.PREMIUM);
            when(users.findById(masterId)).thenReturn(Optional.of(master));
            when(tables.countBySponsorId(masterId)).thenReturn(2L);
            when(tables.existsByInviteCode(any())).thenReturn(false);
            when(tables.save(any(GameTable.class))).thenAnswer(inv -> {
                GameTable t = inv.getArgument(0);
                t.setId(tableId);
                return t;
            });
            when(members.save(any(GameTableMember.class))).thenAnswer(inv -> {
                GameTableMember m = inv.getArgument(0);
                m.setJoinedAt(Instant.now());
                return m;
            });
            when(members.findByGameTableIdOrderByJoinedAtAsc(tableId)).thenReturn(List.of());

            TableDetailResponse r = service.create(masterId,
                    new CreateTableRequest("Terceira", null, null, null, null));

            ArgumentCaptor<GameTable> captor = ArgumentCaptor.forClass(GameTable.class);
            verify(tables).save(captor.capture());
            assertThat(captor.getValue().getSponsor()).isSameAs(master);
            assertThat(captor.getValue().getOwner()).isSameAs(master);
            assertThat(r.canTransferHost()).isTrue();
        }

        @Test @DisplayName("PREMIUM plan: still stops at the technical cap")
        void premiumPlanStopsAtCap() {
            master.setPlan(User.Plan.PREMIUM);
            when(users.findById(masterId)).thenReturn(Optional.of(master));
            when(tables.countBySponsorId(masterId)).thenReturn(3L);

            assertThatThrownBy(() -> service.create(masterId,
                    new CreateTableRequest("Mesa", null, null, null, null)))
                    .isInstanceOf(ConflictException.class);

            verify(tables, never()).save(any());
        }
    }

    // ── transfer host ─────────────────────────────────────────────────────────

    @Nested @DisplayName("transferHost()")
    class TransferHostTest {

        @BeforeEach
        void sponsoredByMaster() {
            table.setSponsor(master);
        }

        private void lockTable() {
            when(tables.findByIdForUpdate(tableId)).thenReturn(Optional.of(table));
        }

        @Test @DisplayName("premium sponsor hands the hosting over; previous host becomes moderator")
        void sponsorTransfers() {
            master.setPlan(User.Plan.PREMIUM);
            asMember(masterM);
            lockTable();
            asMember(playerM);
            stubMembersList(masterM, playerM);

            TableDetailResponse r = service.transferHost(tableId, masterId, playerId);

            assertThat(playerM.getRole()).isEqualTo(Role.MASTER);
            assertThat(masterM.getRole()).isEqualTo(Role.MODERATOR);
            assertThat(table.getOwner()).isSameAs(player);
            assertThat(table.getSponsor()).isSameAs(master);
            assertThat(r.table().ownerUsername()).isEqualTo("ply");
            verify(tables).save(table);
        }

        @Test @DisplayName("a host who is not the sponsor cannot transfer")
        void nonSponsorForbidden() {
            table.setSponsor(moderator);
            moderator.setPlan(User.Plan.PREMIUM);
            asMember(masterM);
            lockTable();

            assertThatThrownBy(() -> service.transferHost(tableId, masterId, playerId))
                    .isInstanceOf(ForbiddenException.class);
            verify(tables, never()).save(any());
        }

        @Test @DisplayName("a sponsor on the free plan cannot transfer")
        void freeSponsorForbidden() {
            asMember(masterM);
            lockTable();

            assertThatThrownBy(() -> service.transferHost(tableId, masterId, playerId))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("paid plan");
        }

        @Test @DisplayName("the new host must already be a member (404)")
        void targetMustBeMember() {
            master.setPlan(User.Plan.PREMIUM);
            asMember(masterM);
            lockTable();
            when(members.findByGameTableIdAndUserId(tableId, playerId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.transferHost(tableId, masterId, playerId))
                    .isInstanceOf(NotFoundException.class);
        }

        @Test @DisplayName("cannot transfer to the member who already hosts the table")
        void targetAlreadyHost() {
            master.setPlan(User.Plan.PREMIUM);
            asMember(masterM);
            lockTable();

            assertThatThrownBy(() -> service.transferHost(tableId, masterId, masterId))
                    .isInstanceOf(ConflictException.class);
        }

        @Test @DisplayName("an outsider gets 404, not 403")
        void outsiderGets404() {
            when(members.findByGameTableIdAndUserId(tableId, playerId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.transferHost(tableId, playerId, masterId))
                    .isInstanceOf(NotFoundException.class);
        }
    }

    // ── read ──────────────────────────────────────────────────────────────────

    @Nested @DisplayName("get()")
    class GetTest {

        @Test @DisplayName("404 for someone who is not a member (no enumeration)")
        void notMemberGets404() {
            when(members.findByGameTableIdAndUserId(tableId, playerId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.get(tableId, playerId))
                    .isInstanceOf(NotFoundException.class);
        }

        @Test @DisplayName("master sees the invite code")
        void masterSeesInviteCode() {
            asMember(masterM);
            stubMembersList(masterM, playerM);

            TableDetailResponse r = service.get(tableId, masterId);

            assertThat(r.inviteCode()).isEqualTo("ABCD2345");
            assertThat(r.members()).hasSize(2);
            assertThat(r.table().playerCount()).isEqualTo(2);
        }

        @Test @DisplayName("player does NOT see the invite code")
        void playerDoesNotSeeInviteCode() {
            asMember(playerM);
            stubMembersList(masterM, playerM);

            TableDetailResponse r = service.get(tableId, playerId);

            assertThat(r.inviteCode()).isNull();
            assertThat(r.table().myRole()).isEqualTo("PLAYER");
        }
    }

    // ── update / delete ───────────────────────────────────────────────────────

    @Nested @DisplayName("update() / delete()")
    class UpdateDeleteTest {

        private UpdateTableRequest req(int max) {
            return new UpdateTableRequest("Novo nome", "Pathfinder 2e", "desc", max, null);
        }

        @Test @DisplayName("master edits the table")
        void masterUpdates() {
            asMember(masterM);
            when(tables.findByIdForUpdate(tableId)).thenReturn(Optional.of(table));
            when(members.countByGameTableId(tableId)).thenReturn(2L);
            stubMembersList(masterM, playerM);

            TableDetailResponse r = service.update(tableId, masterId, req(6));

            assertThat(r.table().name()).isEqualTo("Novo nome");
            assertThat(r.table().gameSystem()).isEqualTo("Pathfinder 2e");
            assertThat(r.table().maxPlayers()).isEqualTo(6);
            verify(tables).save(table);
        }

        @Test @DisplayName("cannot lower the limit below the current member count")
        void cannotLowerBelowMembers() {
            asMember(masterM);
            when(tables.findByIdForUpdate(tableId)).thenReturn(Optional.of(table));
            when(members.countByGameTableId(tableId)).thenReturn(4L);

            assertThatThrownBy(() -> service.update(tableId, masterId, req(3)))
                    .isInstanceOf(ConflictException.class);

            verify(tables, never()).save(any());
        }

        @Test @DisplayName("moderator and player cannot edit (403)")
        void nonMasterCannotEdit() {
            asMember(modM);
            assertThatThrownBy(() -> service.update(tableId, modId, req(5)))
                    .isInstanceOf(ForbiddenException.class);
            asMember(playerM);
            assertThatThrownBy(() -> service.update(tableId, playerId, req(5)))
                    .isInstanceOf(ForbiddenException.class);
        }

        @Test @DisplayName("master deletes the table and its memberships")
        void masterDeletes() {
            asMember(masterM);
            when(tables.findByIdForUpdate(tableId)).thenReturn(Optional.of(table));

            service.delete(tableId, masterId);

            verify(members).deleteByGameTableId(tableId);
            verify(tables).delete(table);
        }

        @Test @DisplayName("player cannot delete the table")
        void playerCannotDelete() {
            asMember(playerM);

            assertThatThrownBy(() -> service.delete(tableId, playerId))
                    .isInstanceOf(ForbiddenException.class);

            verify(tables, never()).delete(any(GameTable.class));
        }
    }

    // ── join / leave / preview ────────────────────────────────────────────────

    @Nested @DisplayName("preview() / join() / leave()")
    class JoinLeaveTest {

        @Test @DisplayName("preview is case-insensitive and reports whether the table is full")
        void previewNormalizesCode() {
            when(tables.findByInviteCode("ABCD2345")).thenReturn(Optional.of(table));
            when(members.countByGameTableId(tableId)).thenReturn(5L);

            TablePreviewResponse r = service.preview("  abcd2345 ");

            assertThat(r.name()).isEqualTo("Em busca dos esquecidos");
            assertThat(r.playerCount()).isEqualTo(5);
            assertThat(r.full()).isTrue();
            assertThat(r.ownerUsername()).isEqualTo("gm");
        }

        @Test @DisplayName("preview with an unknown code is 404")
        void previewUnknownCode() {
            when(tables.findByInviteCode("ZZZZZZZZ")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.preview("zzzzzzzz")).isInstanceOf(NotFoundException.class);
        }

        @Test @DisplayName("a new user joins as PLAYER")
        void joinsAsPlayer() {
            when(tables.findByInviteCode("ABCD2345")).thenReturn(Optional.of(table));
            when(tables.findByIdForUpdate(tableId)).thenReturn(Optional.of(table));
            when(members.findByGameTableIdAndUserId(tableId, playerId)).thenReturn(Optional.empty());
            when(members.countByGameTableId(tableId)).thenReturn(1L);
            when(users.findById(playerId)).thenReturn(Optional.of(player));
            when(members.save(any(GameTableMember.class))).thenAnswer(inv -> {
                GameTableMember m = inv.getArgument(0);
                m.setJoinedAt(Instant.now());
                return m;
            });
            stubMembersList(masterM, playerM);

            TableDetailResponse r = service.join(playerId, new JoinTableRequest("abcd2345"));

            assertThat(r.me().role()).isEqualTo("PLAYER");
            assertThat(r.inviteCode()).isNull();
            ArgumentCaptor<GameTableMember> cap = ArgumentCaptor.forClass(GameTableMember.class);
            verify(members).save(cap.capture());
            assertThat(cap.getValue().getRole()).isEqualTo(Role.PLAYER);
        }

        @Test @DisplayName("joining a full table is a conflict")
        void fullTable() {
            when(tables.findByInviteCode("ABCD2345")).thenReturn(Optional.of(table));
            when(tables.findByIdForUpdate(tableId)).thenReturn(Optional.of(table));
            when(members.findByGameTableIdAndUserId(tableId, playerId)).thenReturn(Optional.empty());
            when(members.countByGameTableId(tableId)).thenReturn(5L);

            assertThatThrownBy(() -> service.join(playerId, new JoinTableRequest("ABCD2345")))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("full");

            verify(members, never()).save(any());
        }

        @Test @DisplayName("joining twice is a conflict")
        void alreadyMember() {
            when(tables.findByInviteCode("ABCD2345")).thenReturn(Optional.of(table));
            when(tables.findByIdForUpdate(tableId)).thenReturn(Optional.of(table));
            when(members.findByGameTableIdAndUserId(tableId, playerId)).thenReturn(Optional.of(playerM));

            assertThatThrownBy(() -> service.join(playerId, new JoinTableRequest("ABCD2345")))
                    .isInstanceOf(ConflictException.class);

            verify(members, never()).save(any());
        }

        @Test @DisplayName("joining with an invalid code is 404")
        void invalidCode() {
            when(tables.findByInviteCode("NOPE")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.join(playerId, new JoinTableRequest("nope")))
                    .isInstanceOf(NotFoundException.class);
        }

        @Test @DisplayName("a player can leave")
        void playerLeaves() {
            asMember(playerM);

            service.leave(tableId, playerId);

            verify(members).delete(playerM);
        }

        @Test @DisplayName("the master cannot leave")
        void masterCannotLeave() {
            asMember(masterM);

            assertThatThrownBy(() -> service.leave(tableId, masterId))
                    .isInstanceOf(ConflictException.class);

            verify(members, never()).delete(any(GameTableMember.class));
        }

        @Test @DisplayName("only the master regenerates the invite code")
        void regenerateInviteCode() {
            asMember(masterM);
            when(tables.findByIdForUpdate(tableId)).thenReturn(Optional.of(table));
            when(tables.existsByInviteCode(any())).thenReturn(false);

            String code = service.regenerateInviteCode(tableId, masterId);

            assertThat(code).hasSize(8).isNotEqualTo("ABCD2345");
            verify(tables).save(table);

            asMember(modM);
            assertThatThrownBy(() -> service.regenerateInviteCode(tableId, modId))
                    .isInstanceOf(ForbiddenException.class);
        }
    }

    // ── membership management ─────────────────────────────────────────────────

    @Nested @DisplayName("updateMyProfile() / removeMember() / changeRole()")
    class MembershipTest {

        @Test @DisplayName("per-table profile: sets, clears and mutes")
        void updatesProfile() {
            asMember(playerM);

            MemberSelfResponse r = service.updateMyProfile(tableId, playerId,
                    new UpdateMemberProfileRequest("  Luckydie ", "https://img/a.png", true));
            assertThat(r.displayName()).isEqualTo("Luckydie");
            assertThat(r.avatarUrl()).isEqualTo("https://img/a.png");
            assertThat(r.muted()).isTrue();

            MemberSelfResponse cleared = service.updateMyProfile(tableId, playerId,
                    new UpdateMemberProfileRequest("   ", "", null));
            assertThat(cleared.displayName()).isNull();
            assertThat(cleared.avatarUrl()).isNull();
            assertThat(cleared.muted()).isTrue();   // null leaves it untouched
        }

        @Test @DisplayName("master removes a player")
        void masterKicksPlayer() {
            asMember(masterM);
            asMember(playerM);

            service.removeMember(tableId, masterId, playerId);

            verify(members).delete(playerM);
        }

        @Test @DisplayName("moderator removes a player but not another moderator or the master")
        void moderatorLimits() {
            asMember(modM);
            asMember(playerM);
            service.removeMember(tableId, modId, playerId);
            verify(members).delete(playerM);

            UUID otherModId = UUID.randomUUID();
            GameTableMember otherMod = member(user(otherModId, "mod2"), Role.MODERATOR);
            when(members.findByGameTableIdAndUserId(tableId, otherModId)).thenReturn(Optional.of(otherMod));
            assertThatThrownBy(() -> service.removeMember(tableId, modId, otherModId))
                    .isInstanceOf(ForbiddenException.class);

            asMember(masterM);
            assertThatThrownBy(() -> service.removeMember(tableId, modId, masterId))
                    .isInstanceOf(ForbiddenException.class);
        }

        @Test @DisplayName("a player cannot remove anyone")
        void playerCannotKick() {
            asMember(playerM);

            assertThatThrownBy(() -> service.removeMember(tableId, playerId, masterId))
                    .isInstanceOf(ForbiddenException.class);
        }

        @Test @DisplayName("removing yourself must use the leave endpoint")
        void cannotKickSelf() {
            asMember(masterM);

            assertThatThrownBy(() -> service.removeMember(tableId, masterId, masterId))
                    .isInstanceOf(ConflictException.class);
        }

        @Test @DisplayName("removing an unknown member is 404")
        void kickUnknown() {
            asMember(masterM);
            UUID ghost = UUID.randomUUID();
            when(members.findByGameTableIdAndUserId(tableId, ghost)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.removeMember(tableId, masterId, ghost))
                    .isInstanceOf(NotFoundException.class);
        }

        @Test @DisplayName("master promotes a player to MODERATOR")
        void promotes() {
            asMember(masterM);
            asMember(playerM);

            MemberResponse r = service.changeRole(tableId, masterId, playerId, new ChangeRoleRequest("MODERATOR"));

            assertThat(r.role()).isEqualTo("MODERATOR");
            assertThat(playerM.getRole()).isEqualTo(Role.MODERATOR);
            verify(members).save(playerM);
        }

        @Test @DisplayName("only the master changes roles, and not their own")
        void roleRules() {
            asMember(modM);
            assertThatThrownBy(() -> service.changeRole(tableId, modId, playerId, new ChangeRoleRequest("PLAYER")))
                    .isInstanceOf(ForbiddenException.class);

            asMember(masterM);
            assertThatThrownBy(() -> service.changeRole(tableId, masterId, masterId, new ChangeRoleRequest("PLAYER")))
                    .isInstanceOf(ConflictException.class);
        }
    }

    // ── list ──────────────────────────────────────────────────────────────────

    @Test @DisplayName("list() returns my tables with role and member count")
    void listsMyTables() {
        when(members.findByUserIdOrderByJoinedAtDesc(playerId)).thenReturn(List.of(playerM));
        when(members.countByGameTableIds(any())).thenReturn(List.<Object[]>of(new Object[]{tableId, 3L}));

        var result = service.list(playerId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).playerCount()).isEqualTo(3);
        assertThat(result.get(0).myRole()).isEqualTo("PLAYER");
        assertThat(result.get(0).ownerUsername()).isEqualTo("gm");
    }

    @Test @DisplayName("list() is empty when the user has no tables")
    void listEmpty() {
        when(members.findByUserIdOrderByJoinedAtDesc(playerId)).thenReturn(List.of());

        assertThat(service.list(playerId)).isEmpty();
        verify(members, never()).countByGameTableIds(any());
    }
}
