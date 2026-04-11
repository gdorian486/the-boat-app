package com.interview.boat.controller;

import com.interview.boat.dto.BoatRequest;
import com.interview.boat.dto.BoatResponse;
import com.interview.boat.dto.PagedResponse;
import com.interview.boat.service.BoatService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;

import java.util.UUID;

@RestController
@RequestMapping("/api/boats")
@Validated
public class BoatController {

    private static final Logger log = LoggerFactory.getLogger(BoatController.class);

    private final BoatService boatService;

    public BoatController(BoatService boatService) {
        this.boatService = boatService;
    }

    @GetMapping
    public ResponseEntity<PagedResponse<BoatResponse>> findAll(
            @RequestParam(defaultValue = "0") @PositiveOrZero(message = "Page must be greater than or equal to 0") int page,
            @RequestParam(defaultValue = "10") @Positive(message = "Size must be greater than 0") @Max(value = 100, message = "Size must be less than or equal to 100") int size
    ) {
        log.debug("GET /api/boats - page={}, size={}", page, size);
        Page<BoatResponse> boats = boatService.findAll(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return ResponseEntity.ok(PagedResponse.from(boats));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BoatResponse> findById(@PathVariable UUID id) {
        log.debug("GET /api/boats/{}", id);
        return ResponseEntity.ok(boatService.findById(id));
    }

    @PostMapping
    public ResponseEntity<BoatResponse> create(@Valid @RequestBody BoatRequest request, @AuthenticationPrincipal Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null || jwt.getSubject().isBlank()) {
            throw new AuthenticationCredentialsNotFoundException("Authentication is required to create a boat");
        }
        log.info("POST /api/boats");
        return ResponseEntity.status(HttpStatus.CREATED).body(boatService.create(request, jwt.getSubject()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BoatResponse> update(@PathVariable UUID id, @Valid @RequestBody BoatRequest request) {
        log.info("PUT /api/boats/{}", id);
        return ResponseEntity.ok(boatService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        log.info("DELETE /api/boats/{}", id);
        boatService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

