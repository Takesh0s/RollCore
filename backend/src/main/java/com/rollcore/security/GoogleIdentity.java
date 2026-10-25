package com.rollcore.security;

/** Verified identity extracted from a Google ID token. */
public record GoogleIdentity(String subject, String email, String name) {}
