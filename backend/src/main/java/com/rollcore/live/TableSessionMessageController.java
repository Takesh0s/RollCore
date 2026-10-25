package com.rollcore.live;

import com.rollcore.dto.request.RollRequest;
import com.rollcore.exception.InvalidFormulaException;
import com.rollcore.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

/**
 * STOMP entry point of a live table.
 *
 * <pre>
 * SEND /app/tables/{tableId}/roll   {"formula":"2d6+3"}
 *   → everyone on /topic/tables/{tableId}/rolls receives the {@link TableRollEvent}
 *   → failures go only to the sender, on /user/queue/errors
 * </pre>
 */
@Controller
@RequiredArgsConstructor
public class TableSessionMessageController {

    private static final Logger log = LoggerFactory.getLogger(TableSessionMessageController.class);

    private final TableSessionService sessions;

    @MessageMapping("/tables/{tableId}/roll")
    public void roll(@DestinationVariable UUID tableId, @Payload RollRequest request, Principal principal) {
        sessions.roll(tableId, UUID.fromString(principal.getName()), request);
    }

    @MessageExceptionHandler(InvalidFormulaException.class)
    @SendToUser(destinations = Destinations.USER_ERRORS, broadcast = false)
    public ErrorEvent invalidFormula(InvalidFormulaException e) {
        return new ErrorEvent("INVALID_FORMULA", e.getMessage());
    }

    @MessageExceptionHandler(NotFoundException.class)
    @SendToUser(destinations = Destinations.USER_ERRORS, broadcast = false)
    public ErrorEvent notFound(NotFoundException e) {
        return new ErrorEvent("NOT_FOUND", e.getMessage());
    }

    @MessageExceptionHandler(Exception.class)
    @SendToUser(destinations = Destinations.USER_ERRORS, broadcast = false)
    public ErrorEvent unexpected(Exception e) {
        log.warn("Unexpected error handling a table message", e);
        return new ErrorEvent("ERROR", "Could not process the message.");
    }
}
