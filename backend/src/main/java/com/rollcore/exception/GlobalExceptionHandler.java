package com.rollcore.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Centralised error handling — translates exceptions to RFC 7807 Problem Details.
 *
 * <p>Error messages are intentionally generic for security-sensitive cases
 * (e.g. login failure) to prevent user enumeration — UC-01 RN-03 / OWASP.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ── 400 Bad Request ───────────────────────────────────────────────────────

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        fe -> fe.getDefaultMessage() == null ? "Invalid" : fe.getDefaultMessage(),
                        (a, b) -> a));

        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        pd.setType(URI.create("urn:rollcore:validation-error"));
        pd.setTitle("Validation Error");
        pd.setDetail("One or more fields are invalid.");
        pd.setProperty("fields", errors);
        return pd;
    }

    @ExceptionHandler(InvalidFormulaException.class)
    public ProblemDetail handleInvalidFormula(InvalidFormulaException ex) {
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        pd.setType(URI.create("urn:rollcore:invalid-formula"));
        pd.setTitle("Invalid Formula");
        pd.setDetail(ex.getMessage());
        return pd;
    }

    // ── 401 Unauthorized ──────────────────────────────────────────────────────

    /**
     * Login failure — uses MSG003 wording from UC-01 E01 (generic, OWASP).
     * UC-01 RN-03: do not reveal which field is wrong.
     */
    @ExceptionHandler({BadCredentialsException.class, UsernameNotFoundException.class})
    public ProblemDetail handleBadCredentials(RuntimeException ex) {
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.UNAUTHORIZED);
        pd.setType(URI.create("urn:rollcore:bad-credentials"));
        pd.setTitle("Invalid Credentials");
        pd.setDetail("Email or password is incorrect.");   // MSG003 — UC-01 E01
        return pd;
    }

    // ── 403 Forbidden ─────────────────────────────────────────────────────────

    @ExceptionHandler(ForbiddenException.class)
    public ProblemDetail handleForbidden(ForbiddenException ex) {
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
        pd.setType(URI.create("urn:rollcore:forbidden"));
        pd.setTitle("Access Denied");
        pd.setDetail(ex.getMessage());
        return pd;
    }

    // ── 404 Not Found ─────────────────────────────────────────────────────────

    @ExceptionHandler(NotFoundException.class)
    public ProblemDetail handleNotFound(NotFoundException ex) {
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
        pd.setType(URI.create("urn:rollcore:not-found"));
        pd.setTitle("Not Found");
        pd.setDetail(ex.getMessage());
        return pd;
    }

    // ── 409 Conflict ──────────────────────────────────────────────────────────

    @ExceptionHandler(ConflictException.class)
    public ProblemDetail handleConflict(ConflictException ex) {
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.CONFLICT);
        pd.setType(URI.create("urn:rollcore:conflict"));
        pd.setTitle("Conflict");
        pd.setDetail(ex.getMessage());
        return pd;
    }

    // ── 500 Internal Server Error ─────────────────────────────────────────────

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleUnexpected(Exception ex) {
        log.error("Unhandled exception", ex);
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        pd.setType(URI.create("urn:rollcore:internal-error"));
        pd.setTitle("Internal Error");
        pd.setDetail("An unexpected error occurred. Please try again.");
        return pd;
    }
}
