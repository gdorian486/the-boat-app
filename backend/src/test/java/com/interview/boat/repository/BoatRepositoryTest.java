package com.interview.boat.repository;

import com.interview.boat.TestcontainersConfiguration;
import com.interview.boat.entity.Boat;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Import(TestcontainersConfiguration.class)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class BoatRepositoryTest {

    @Autowired
    private BoatRepository boatRepository;

    @Test
    void deleteByIdReturningCountShouldReturnOneAndDeleteBoatWhenBoatExists() {
        Boat boat = new Boat();
        boat.setName("Aurora");
        boat.setDescription("Long-range cruiser");
        boat.setCreatedBy(UUID.fromString("22222222-2222-2222-2222-222222222222"));

        Boat savedBoat = boatRepository.saveAndFlush(boat);

        int deletedRows = boatRepository.deleteByIdReturningCount(savedBoat.getId());

        assertThat(deletedRows).isEqualTo(1);
        assertThat(boatRepository.findById(savedBoat.getId())).isEmpty();
    }

    @Test
    void deleteByIdReturningCountShouldReturnZeroWhenBoatDoesNotExist() {
        UUID missingId = UUID.randomUUID();

        int deletedRows = boatRepository.deleteByIdReturningCount(missingId);

        assertThat(deletedRows).isZero();
    }
}
