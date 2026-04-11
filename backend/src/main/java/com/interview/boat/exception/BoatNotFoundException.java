package com.interview.boat.exception;

import java.util.UUID;

public class BoatNotFoundException extends RuntimeException {

    public BoatNotFoundException(UUID id) {
        super("Boat not found with id: " + id);
    }
}

