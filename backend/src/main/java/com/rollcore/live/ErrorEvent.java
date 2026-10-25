package com.rollcore.live;

/** Error pushed to the offending client only, on {@code /user/queue/errors}. */
public record ErrorEvent(String code, String message) {}
