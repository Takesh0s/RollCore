package com.rollcore.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

// ── 400 ───────────────────────────────────────────────────────────────────────

/**
 * Thrown when a dice formula does not match NdX | NdX+M | NdX-M — UC-03 RN-01 / E01.
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InvalidFormulaException extends RuntimeException {
    public InvalidFormulaException(String formula) {
        super("Fórmula inválida: \"" + formula +
              "\". Use o formato NdX, NdX+M ou NdX-M (ex: 2d6+3).");
    }
}
