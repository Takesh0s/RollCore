package com.rollcore.live;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("PresenceService")
class PresenceServiceTest {

    private final PresenceService presence = new PresenceService();
    private final UUID tableA = UUID.randomUUID();
    private final UUID tableB = UUID.randomUUID();
    private final UUID ana    = UUID.randomUUID();
    private final UUID bruno  = UUID.randomUUID();

    @Test @DisplayName("a user is online while they hold a subscription")
    void joinAndLeave() {
        presence.join("s1", "sub-0", tableA, ana);
        assertThat(presence.online(tableA)).containsExactly(ana);

        UUID table = presence.leave("s1", "sub-0");

        assertThat(table).isEqualTo(tableA);
        assertThat(presence.online(tableA)).isEmpty();
    }

    @Test @DisplayName("two connections of the same user count once and keep them online until the last one leaves")
    void sameUserTwoConnections() {
        presence.join("phone", "sub-0", tableA, ana);
        presence.join("browser", "sub-0", tableA, ana);

        assertThat(presence.online(tableA)).containsExactly(ana);

        presence.leaveSession("phone");
        assertThat(presence.online(tableA)).containsExactly(ana);

        presence.leaveSession("browser");
        assertThat(presence.online(tableA)).isEmpty();
    }

    @Test @DisplayName("presence is tracked per table")
    void perTable() {
        presence.join("s1", "sub-0", tableA, ana);
        presence.join("s2", "sub-0", tableB, bruno);

        assertThat(presence.online(tableA)).containsExactly(ana);
        assertThat(presence.online(tableB)).containsExactly(bruno);
    }

    @Test @DisplayName("leaving a whole connection reports every table that changed")
    void leaveSessionReportsTables() {
        presence.join("s1", "sub-0", tableA, ana);
        presence.join("s1", "sub-1", tableB, ana);
        presence.join("s2", "sub-0", tableA, bruno);

        Set<UUID> affected = presence.leaveSession("s1");

        assertThat(affected).containsExactlyInAnyOrder(tableA, tableB);
        assertThat(presence.online(tableA)).containsExactly(bruno);
        assertThat(presence.online(tableB)).isEmpty();
    }

    @Test @DisplayName("unknown subscriptions and sessions are ignored")
    void unknown() {
        assertThat(presence.leave("nope", "sub-0")).isNull();
        assertThat(presence.leaveSession("nope")).isEmpty();
    }
}
