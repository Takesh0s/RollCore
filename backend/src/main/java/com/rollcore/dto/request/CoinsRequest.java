package com.rollcore.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/** Coin purse of a character: platinum, gold, silver and copper pieces. */
public record CoinsRequest(
    @NotNull @Min(0) @Max(999_999) Integer pp,
    @NotNull @Min(0) @Max(999_999) Integer gp,
    @NotNull @Min(0) @Max(999_999) Integer sp,
    @NotNull @Min(0) @Max(999_999) Integer cp
) {}
