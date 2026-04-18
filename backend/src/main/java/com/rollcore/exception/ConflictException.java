package com.rollcore.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * 409 – resource already exists.
 * Used when e-mail or username is already taken — UC-01 A01 / MSG001.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class ConflictException extends RuntimeException {
    public ConflictException(String message) { super(message); }
}
