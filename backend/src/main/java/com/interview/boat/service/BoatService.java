package com.interview.boat.service;

import com.interview.boat.dto.BoatRequest;
import com.interview.boat.dto.BoatResponse;
import com.interview.boat.entity.Boat;
import com.interview.boat.exception.BoatNotFoundException;
import com.interview.boat.repository.BoatRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class BoatService {

    private static final Logger log = LoggerFactory.getLogger(BoatService.class);

    private final BoatRepository boatRepository;

    public BoatService(BoatRepository boatRepository) {
        this.boatRepository = boatRepository;
    }

    public Page<BoatResponse> findAll(Pageable pageable) {
        return boatRepository.findAll(pageable).map(this::toResponse);
    }

    public BoatResponse findById(UUID id) {
        return boatRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> {
                    log.warn("Boat not found: id={}", id);
                    return new BoatNotFoundException(id);
                });
    }

    @Transactional
    public BoatResponse create(BoatRequest request, UUID createdBy) {
        Boat boat = new Boat();
        boat.setName(request.name());
        boat.setDescription(request.description());
        boat.setCreatedBy(createdBy);
        BoatResponse response = toResponse(boatRepository.save(boat));
        log.info("Boat created: id={}", response.id());
        return response;
    }

    @Transactional
    public BoatResponse update(UUID id, BoatRequest request) {
        Boat boat = boatRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Boat not found for update: id={}", id);
                    return new BoatNotFoundException(id);
                });
        boat.setName(request.name());
        boat.setDescription(request.description());
        log.info("Boat updated: id={}", id);
        return toResponse(boat);
    }

    @Transactional
    public void delete(UUID id) {
        int deletedRows = boatRepository.deleteByIdReturningCount(id);
        if (deletedRows == 0) {
            log.warn("Boat not found for deletion: id={}", id);
            throw new BoatNotFoundException(id);
        }
        log.info("Boat deleted: id={}", id);
    }

    private BoatResponse toResponse(Boat boat) {
        return new BoatResponse(
                boat.getId(),
                boat.getName(),
                boat.getDescription(),
                boat.getCreatedBy(),
                boat.getCreatedAt()
        );
    }
}

