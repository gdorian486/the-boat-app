package com.interview.boat.service;

import com.interview.boat.dto.BoatRequest;
import com.interview.boat.dto.BoatResponse;
import com.interview.boat.entity.Boat;
import com.interview.boat.exception.BoatNotFoundException;
import com.interview.boat.repository.BoatRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BoatServiceTest {

    @Mock
    private BoatRepository boatRepository;

    @InjectMocks
    private BoatService boatService;

    @Test
    void findAllShouldReturnMappedPageOfBoatResponses() {
        Pageable pageable = PageRequest.of(1, 5);
        Boat boat = boat(
                UUID.randomUUID(),
                "Aurora",
                "Long-range cruiser",
                "alice",
                Instant.parse("2026-04-10T09:15:00Z")
        );
        Page<Boat> page = new PageImpl<>(List.of(boat), pageable, 6);

        when(boatRepository.findAll(pageable)).thenReturn(page);

        Page<BoatResponse> result = boatService.findAll(pageable);

        assertThat(result.getContent())
                .singleElement()
                .satisfies(response -> {
                    assertThat(response.id()).isEqualTo(boat.getId());
                    assertThat(response.name()).isEqualTo("Aurora");
                    assertThat(response.description()).isEqualTo("Long-range cruiser");
                    assertThat(response.createdBy()).isEqualTo("alice");
                    assertThat(response.createdAt()).isEqualTo(boat.getCreatedAt());
                });
        assertThat(result.getTotalElements()).isEqualTo(6);
    }

    @Test
    void findByIdShouldReturnMappedBoatResponseWhenBoatExists() {
        UUID boatId = UUID.randomUUID();
        Boat boat = boat(
                boatId,
                "Skylark",
                "Day sailer",
                "bob",
                Instant.parse("2026-04-09T12:00:00Z")
        );

        when(boatRepository.findById(boatId)).thenReturn(Optional.of(boat));

        BoatResponse result = boatService.findById(boatId);

        assertThat(result.id()).isEqualTo(boatId);
        assertThat(result.name()).isEqualTo("Skylark");
        assertThat(result.description()).isEqualTo("Day sailer");
        assertThat(result.createdBy()).isEqualTo("bob");
        assertThat(result.createdAt()).isEqualTo(boat.getCreatedAt());
    }

    @Test
    void findByIdShouldThrowWhenBoatDoesNotExist() {
        UUID boatId = UUID.randomUUID();

        when(boatRepository.findById(boatId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> boatService.findById(boatId))
                .isInstanceOf(BoatNotFoundException.class)
                .hasMessage("Boat not found with id: " + boatId);
    }

    @Test
    void createShouldPopulateBoatAndReturnSavedBoatResponse() {
        BoatRequest request = new BoatRequest("Odyssey", "Ocean capable");
        Instant createdAt = Instant.parse("2026-04-11T08:00:00Z");
        UUID savedId = UUID.randomUUID();

        when(boatRepository.save(any(Boat.class))).thenAnswer(invocation -> {
            Boat savedBoat = invocation.getArgument(0);
            savedBoat.setId(savedId);
            savedBoat.setCreatedAt(createdAt);
            return savedBoat;
        });

        BoatResponse result = boatService.create(request, "captain");

        ArgumentCaptor<Boat> boatCaptor = ArgumentCaptor.forClass(Boat.class);
        verify(boatRepository).save(boatCaptor.capture());
        Boat persistedBoat = boatCaptor.getValue();
        assertThat(persistedBoat.getName()).isEqualTo("Odyssey");
        assertThat(persistedBoat.getDescription()).isEqualTo("Ocean capable");
        assertThat(persistedBoat.getCreatedBy()).isEqualTo("captain");

        assertThat(result.id()).isEqualTo(savedId);
        assertThat(result.name()).isEqualTo("Odyssey");
        assertThat(result.description()).isEqualTo("Ocean capable");
        assertThat(result.createdBy()).isEqualTo("captain");
        assertThat(result.createdAt()).isEqualTo(createdAt);
    }

    @Test
    void updateShouldModifyExistingBoatAndReturnMappedResponse() {
        UUID boatId = UUID.randomUUID();
        Boat existingBoat = boat(
                boatId,
                "Old Name",
                "Old description",
                "owner",
                Instant.parse("2026-04-01T10:30:00Z")
        );
        BoatRequest request = new BoatRequest("New Name", "Updated description");

        when(boatRepository.findById(boatId)).thenReturn(Optional.of(existingBoat));

        BoatResponse result = boatService.update(boatId, request);

        assertThat(existingBoat.getName()).isEqualTo("New Name");
        assertThat(existingBoat.getDescription()).isEqualTo("Updated description");
        assertThat(result.id()).isEqualTo(boatId);
        assertThat(result.name()).isEqualTo("New Name");
        assertThat(result.description()).isEqualTo("Updated description");
        assertThat(result.createdBy()).isEqualTo("owner");
        assertThat(result.createdAt()).isEqualTo(existingBoat.getCreatedAt());
    }

    @Test
    void updateShouldThrowWhenBoatDoesNotExist() {
        UUID boatId = UUID.randomUUID();
        BoatRequest request = new BoatRequest("Name", "Description");

        when(boatRepository.findById(boatId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> boatService.update(boatId, request))
                .isInstanceOf(BoatNotFoundException.class)
                .hasMessage("Boat not found with id: " + boatId);
    }

    @Test
    void deleteShouldRemoveBoatWhenRepositoryReportsOneDeletedRow() {
        UUID boatId = UUID.randomUUID();

        when(boatRepository.deleteByIdReturningCount(boatId)).thenReturn(1);

        boatService.delete(boatId);

        verify(boatRepository).deleteByIdReturningCount(boatId);
    }

    @Test
    void deleteShouldThrowWhenRepositoryReportsNoDeletedRows() {
        UUID boatId = UUID.randomUUID();

        when(boatRepository.deleteByIdReturningCount(boatId)).thenReturn(0);

        assertThatThrownBy(() -> boatService.delete(boatId))
                .isInstanceOf(BoatNotFoundException.class)
                .hasMessage("Boat not found with id: " + boatId);
    }

    private Boat boat(UUID id, String name, String description, String createdBy, Instant createdAt) {
        Boat boat = new Boat();
        boat.setId(id);
        boat.setName(name);
        boat.setDescription(description);
        boat.setCreatedBy(createdBy);
        boat.setCreatedAt(createdAt);
        return boat;
    }
}
