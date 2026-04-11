package com.interview.boat.dto;

import java.time.Instant;
import java.util.UUID;

public record BoatResponse(
        UUID id,
        String name,
        String description,
        String createdBy,
        Instant createdAt
) {
}

