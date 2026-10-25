package com.rollcore.dto.response;

/** "Visão Geral ao Ingressar em uma nova mesa" — public info shown before joining. */
public record TablePreviewResponse(
    String  name,
    String  gameSystem,
    String  description,
    String  coverUrl,
    int     playerCount,
    int     maxPlayers,
    String  ownerUsername,
    boolean full
) {}
