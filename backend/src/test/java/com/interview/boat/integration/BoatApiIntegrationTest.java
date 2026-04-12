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

    private static final String API_BOATS = "/api/boats";
    private static final String API_BOAT_BY_ID = "/api/boats/{id}";
    private static final String AUTHENTICATION_REQUIRED = "Authentication required";
    private static final String VALIDATION_FAILED = "Validation failed";
    private static final String MESSAGE_PATH = "$.message";
    private static final String PATH_PATH = "$.path";
    private static final String NAME_PATH = "$.name";
    private static final String CAPTAIN = "captain";
    private static final String ODYSSEY = "Odyssey";
    private static final String ODYSSEY_II = "Odyssey II";
    private static final String OCEAN_CAPABLE = "Ocean capable";
    private static final String REFITTED_FOR_RACING = "Refitted for racing";

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
        MvcResult createResult = mockMvc.perform(post(API_BOATS)
                        .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject(CAPTAIN)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Odyssey",
                                  "description": "Ocean capable"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath(NAME_PATH).value(ODYSSEY))
                .andExpect(jsonPath("$.description").value(OCEAN_CAPABLE))
                .andExpect(jsonPath("$.createdBy").value(CAPTAIN))
                .andReturn();

        UUID boatId = UUID.fromString(readBody(createResult).get("id").asText());

        Boat createdBoat = boatRepository.findById(boatId).orElseThrow();
        assertThat(createdBoat.getName()).isEqualTo(ODYSSEY);
        assertThat(createdBoat.getDescription()).isEqualTo(OCEAN_CAPABLE);
        assertThat(createdBoat.getCreatedBy()).isEqualTo(CAPTAIN);
        assertThat(createdBoat.getCreatedAt()).isNotNull();

        mockMvc.perform(get(API_BOAT_BY_ID, boatId)
                        .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject(CAPTAIN))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(boatId.toString()))
                .andExpect(jsonPath(NAME_PATH).value(ODYSSEY));

        mockMvc.perform(put(API_BOAT_BY_ID, boatId)
                        .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject(CAPTAIN)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Odyssey II",
                                  "description": "Refitted for racing"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(boatId.toString()))
                .andExpect(jsonPath(NAME_PATH).value(ODYSSEY_II))
                .andExpect(jsonPath("$.description").value(REFITTED_FOR_RACING))
                .andExpect(jsonPath("$.createdBy").value(CAPTAIN));

        Boat updatedBoat = boatRepository.findById(boatId).orElseThrow();
        assertThat(updatedBoat.getName()).isEqualTo(ODYSSEY_II);
        assertThat(updatedBoat.getDescription()).isEqualTo(REFITTED_FOR_RACING);

        mockMvc.perform(delete(API_BOAT_BY_ID, boatId)
                        .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject(CAPTAIN))))
                .andExpect(status().isNoContent());

        assertThat(boatRepository.findById(boatId)).isEmpty();
    }

    @Test
    void findAllShouldReturnPersistedBoatsWithPagingMetadata() throws Exception {
        boatRepository.saveAndFlush(boat("Aurora", "Long-range cruiser", "alice"));
        boatRepository.saveAndFlush(boat("Skylark", "Day sailer", "bob"));
        boatRepository.saveAndFlush(boat("Tidal", "Harbor boat", "carol"));

        mockMvc.perform(get(API_BOATS)
                        .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject(CAPTAIN)))
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
        mockMvc.perform(post(API_BOATS)
                        .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject(CAPTAIN)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "",
                                  "description": "Ocean capable"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath(MESSAGE_PATH).value(VALIDATION_FAILED))
                .andExpect(jsonPath("$.fieldErrors.name").value("Name is required"));

        assertThat(boatRepository.count()).isZero();
    }

    @Test
    void createShouldReturnUnauthorizedWhenJwtSubjectIsBlank() throws Exception {
        mockMvc.perform(post(API_BOATS)
                        .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject(" ")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Odyssey",
                                  "description": "Ocean capable"
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath(MESSAGE_PATH).value(AUTHENTICATION_REQUIRED))
                .andExpect(jsonPath(PATH_PATH).value(API_BOATS));

        assertThat(boatRepository.count()).isZero();
    }

    @Test
    void updateShouldReturnNotFoundWhenBoatDoesNotExist() throws Exception {
        UUID missingId = UUID.randomUUID();

        mockMvc.perform(put(API_BOAT_BY_ID, missingId)
                        .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject(CAPTAIN)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Odyssey II",
                                  "description": "Refitted for racing"
                                }
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath(MESSAGE_PATH).value("Boat not found with id: " + missingId))
                .andExpect(jsonPath(PATH_PATH).value(API_BOATS + "/" + missingId));
    }

    @Test
    void deleteShouldReturnNotFoundWhenBoatDoesNotExist() throws Exception {
        UUID missingId = UUID.randomUUID();

        mockMvc.perform(delete(API_BOAT_BY_ID, missingId)
                        .with(SecurityMockMvcRequestPostProcessors.jwt().jwt(jwt -> jwt.subject(CAPTAIN))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath(MESSAGE_PATH).value("Boat not found with id: " + missingId))
                .andExpect(jsonPath(PATH_PATH).value(API_BOATS + "/" + missingId));
    }

    @Test
    void findAllShouldReturnUnauthorizedWhenJwtIsMissing() throws Exception {
        boatRepository.saveAndFlush(boat("Aurora", "Long-range cruiser", "alice"));

        mockMvc.perform(get(API_BOATS)
                        .param("page", "0")
                        .param("size", "2"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath(MESSAGE_PATH).value(AUTHENTICATION_REQUIRED));
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
