package com.rollcore.exception;

/** The map payload is not acceptable, e.g. its layers are not a JSON object or are too large (HTTP 400). */
public class InvalidMapException extends RuntimeException {
    public InvalidMapException(String message) {
        super(message);
    }
}
