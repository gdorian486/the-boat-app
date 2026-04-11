package com.interview.boat.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.boat.TestcontainersConfiguration;
import com.interview.boat.entity.Boat;
import com.interview.boat.repository.BoatRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class BoatApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private BoatRepository boatRepository;

    @BeforeEach
    void cleanDatabase() {
        boatRepository.deleteAll();
    }

    @Test
    void createUpdateGetAndDeleteShouldPersistChangesThroughTheApi() throws Exception {
        MvcResult createResult = mockMvc.perform(post("/api/boats")
                        .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("captain")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Odyssey",
                                  "description": "Ocean capable"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Odyssey"))
                .andExpect(jsonPath("$.description").value("Ocean capable"))
                .andExpect(jsonPath("$.createdBy").value("captain"))
                .andReturn();

        UUID boatId = UUID.fromString(readBody(createResult).get("id").asText());

        Boat createdBoat = boatRepository.findById(boatId).orElseThrow();
        assertThat(createdBoat.getName()).isEqualTo("Odyssey");
        assertThat(createdBoat.getDescription()).isEqualTo("Ocean capable");
        assertThat(createdBoat.getCreatedBy()).isEqualTo("captain");
        assertThat(createdBoat.getCreatedAt()).isNotNull();

        mockMvc.perform(get("/api/boats/{id}", boatId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(boatId.toString()))
                .andExpect(jsonPath("$.name").value("Odyssey"));

        mockMvc.perform(put("/api/boats/{id}", boatId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Odyssey II",
                                  "description": "Refitted for racing"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(boatId.toString()))
                .andExpect(jsonPath("$.name").value("Odyssey II"))
                .andExpect(jsonPath("$.description").value("Refitted for racing"))
                .andExpect(jsonPath("$.createdBy").value("captain"));

        Boat updatedBoat = boatRepository.findById(boatId).orElseThrow();
        assertThat(updatedBoat.getName()).isEqualTo("Odyssey II");
        assertThat(updatedBoat.getDescription()).isEqualTo("Refitted for racing");

        mockMvc.perform(delete("/api/boats/{id}", boatId))
                .andExpect(status().isNoContent());

        assertThat(boatRepository.findById(boatId)).isEmpty();
    }

    @Test
    void findAllShouldReturnPersistedBoatsWithPagingMetadata() throws Exception {
        boatRepository.saveAndFlush(boat("Aurora", "Long-range cruiser", "alice"));
        boatRepository.saveAndFlush(boat("Skylark", "Day sailer", "bob"));
        boatRepository.saveAndFlush(boat("Tidal", "Harbor boat", "carol"));

        mockMvc.perform(get("/api/boats")
                        .param("page", "0")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.numberOfElements").value(2))
                .andExpect(jsonPath("$.content.length()").value(2));
    }

    @Test
    void createShouldReturnValidationErrorAndNotPersistBoatWhenPayloadIsInvalid() throws Exception {
        mockMvc.perform(post("/api/boats")
                        .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject("captain")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "",
                                  "description": "Ocean capable"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.fieldErrors.name").value("Name is required"));

        assertThat(boatRepository.count()).isZero();
    }

    @Test
    void createShouldReturnUnauthorizedWhenJwtSubjectIsBlank() throws Exception {
        mockMvc.perform(post("/api/boats")
                        .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject(" ")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Odyssey",
                                  "description": "Ocean capable"
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Authentication required"))
                .andExpect(jsonPath("$.path").value("/api/boats"));

        assertThat(boatRepository.count()).isZero();
    }

    @Test
    void updateShouldReturnNotFoundWhenBoatDoesNotExist() throws Exception {
        UUID missingId = UUID.randomUUID();

        mockMvc.perform(put("/api/boats/{id}", missingId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Odyssey II",
                                  "description": "Refitted for racing"
                                }
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Boat not found with id: " + missingId))
                .andExpect(jsonPath("$.path").value("/api/boats/" + missingId));
    }

    @Test
    void deleteShouldReturnNotFoundWhenBoatDoesNotExist() throws Exception {
        UUID missingId = UUID.randomUUID();

        mockMvc.perform(delete("/api/boats/{id}", missingId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Boat not found with id: " + missingId))
                .andExpect(jsonPath("$.path").value("/api/boats/" + missingId));
    }

    private JsonNode readBody(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private Boat boat(String name, String description, String createdBy) {
        Boat boat = new Boat();
        boat.setName(name);
        boat.setDescription(description);
        boat.setCreatedBy(createdBy);
        return boat;
    }
}
