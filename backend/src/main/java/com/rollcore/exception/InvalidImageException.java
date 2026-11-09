package com.rollcore.exception;

/** The uploaded file is empty, too large or not a JPEG / PNG / WebP picture (HTTP 400). */
public class InvalidImageException extends RuntimeException {
    public InvalidImageException(String message) {
        super(message);
    }
}
