package com.rollcore.dto.response;

import com.rollcore.entity.DiceShortcut;

import java.util.UUID;

/** A saved dice shortcut. */
public record DiceShortcutResponse(UUID id, String name, String formula) {

    public static DiceShortcutResponse from(DiceShortcut s) {
        return new DiceShortcutResponse(s.getId(), s.getName(), s.getFormula());
    }
}
