package com.rollcore.live;

import com.rollcore.dto.request.RollRequest;
import com.rollcore.exception.InvalidFormulaException;
import com.rollcore.exception.NotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.security.Principal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("TableSessionMessageController")
class TableSessionMessageControllerTest {

    @Mock TableSessionService sessions;
    @InjectMocks TableSessionMessageController controller;

    @Test @DisplayName("a roll message is handed to the service with the caller's id")
    void roll() {
        UUID tableId = UUID.randomUUID();
        UUID userId  = UUID.randomUUID();
        Principal principal = new UsernamePasswordAuthenticationToken(userId.toString(), null);
        RollRequest request = new RollRequest("1d20");

        controller.roll(tableId, request, principal);

        verify(sessions).roll(tableId, userId, request);
    }

    @Test @DisplayName("errors become private error events")
    void errors() {
        assertThat(controller.invalidFormula(new InvalidFormulaException("zz")).code()).isEqualTo("INVALID_FORMULA");
        assertThat(controller.notFound(new NotFoundException("Table not found.")).code()).isEqualTo("NOT_FOUND");
        assertThat(controller.unexpected(new IllegalStateException("boom")).code()).isEqualTo("ERROR");
        assertThat(controller.unexpected(new IllegalStateException("boom")).message()).doesNotContain("boom");
    }
}
