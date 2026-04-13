package com.interview.boat.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.boat.dto.BoatRequest;
import com.interview.boat.dto.BoatResponse;
import com.interview.boat.exception.BoatNotFoundException;
import com.interview.boat.exception.GlobalExceptionHandler;
import com.interview.boat.security.SecurityConfig;
import com.interview.boat.service.BoatService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BoatController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class})
class BoatControllerTest {

    private static final String API_BOATS = "/api/boats";
    private static final String API_BOAT_BY_ID = "/api/boats/{id}";
    private static final String AUTHENTICATION_REQUIRED = "Authentication required";
    private static final String VALIDATION_FAILED = "Validation failed";
    private static final String MESSAGE_PATH = "$.message";
    private static final String PATH_PATH = "$.path";
    private static final String NAME_PATH = "$.name";
    private static final UUID CAPTAIN = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID ALICE = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID BOB = UUID.fromString("33333333-3333-3333-3333-333333333333");
    private static final UUID OWNER = UUID.fromString("44444444-4444-4444-4444-444444444444");
    private static final String ODYSSEY = "Odyssey";
    private static final String OCEAN_CAPABLE = "Ocean capable";
    private static final String NEW_NAME = "New Name";
    private static final String UPDATED_DESCRIPTION = "Updated description";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private BoatService boatService;

    @Test
    void findAllShouldReturnPagedBoatResponseUsingDescendingCreatedAtSort() throws Exception {
        BoatResponse boat = new BoatResponse(
                UUID.randomUUID(),
                "Aurora",
                "Long-range cruiser",
                ALICE,
                Instant.parse("2026-04-11T10:00:00Z")
        );
        PageRequest expectedPageRequest = PageRequest.of(1, 5, Sort.by(Sort.Direction.DESC, "createdAt"));

        when(boatService.findAll(expectedPageRequest))
                .thenReturn(new PageImpl<>(List.of(boat), expectedPageRequest, 6));

        mockMvc.perform(get(API_BOATS)
                        .with(jwt())
                        .param("page", "1")
                        .param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(boat.id().toString()))
                .andExpect(jsonPath("$.content[0].name").value("Aurora"))
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.size").value(5))
                .andExpect(jsonPath("$.totalElements").value(6))
                .andExpect(jsonPath("$.totalPages").value(2));

        verify(boatService).findAll(expectedPageRequest);
    }

    @Test
    void findAllShouldReturnValidationErrorWhenPageIsNegative() throws Exception {
        mockMvc.perform(get(API_BOATS)
                        .with(jwt())
                        .param("page", "-1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath(MESSAGE_PATH).value(VALIDATION_FAILED))
                .andExpect(jsonPath("$.fieldErrors.page").value("Page must be greater than or equal to 0"));

        verify(boatService, never()).findAll(any());
    }

    @Test
    void findAllShouldReturnValidationErrorWhenSizeExceedsMaximum() throws Exception {
        mockMvc.perform(get(API_BOATS)
                        .with(jwt())
                        .param("size", "101"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath(MESSAGE_PATH).value(VALIDATION_FAILED))
                .andExpect(jsonPath("$.fieldErrors.size").value("Size must be less than or equal to 100"));

        verify(boatService, never()).findAll(any());
    }

    @Test
    void findAllShouldReturnValidationErrorWhenSizeIsZero() throws Exception {
        mockMvc.perform(get(API_BOATS)
                        .with(jwt())
                        .param("size", "0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath(MESSAGE_PATH).value(VALIDATION_FAILED))
                .andExpect(jsonPath("$.fieldErrors.size").value("Size must be greater than 0"));

        verify(boatService, never()).findAll(any());
    }

    @Test
    void findByIdShouldReturnBoatWhenBoatExists() throws Exception {
        UUID boatId = UUID.randomUUID();
        BoatResponse response = new BoatResponse(
                boatId,
                "Skylark",
                "Day sailer",
                BOB,
                Instant.parse("2026-04-09T12:00:00Z")
        );

        when(boatService.findById(boatId)).thenReturn(response);

        mockMvc.perform(get(API_BOAT_BY_ID, boatId)
                        .with(jwt()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(boatId.toString()))
                .andExpect(jsonPath(NAME_PATH).value("Skylark"))
                .andExpect(jsonPath("$.createdBy").value(BOB.toString()));
    }

    @Test
    void findByIdShouldReturnNotFoundPayloadWhenBoatDoesNotExist() throws Exception {
        UUID boatId = UUID.randomUUID();

        when(boatService.findById(boatId)).thenThrow(new BoatNotFoundException(boatId));

        mockMvc.perform(get(API_BOAT_BY_ID, boatId)
                        .with(jwt()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath(MESSAGE_PATH).value("Boat not found with id: " + boatId))
                .andExpect(jsonPath(PATH_PATH).value(API_BOATS + "/" + boatId));
    }

    @Test
    void createShouldReturnCreatedBoatWhenJwtSubjectIsPresent() throws Exception {
        BoatRequest request = new BoatRequest(ODYSSEY, OCEAN_CAPABLE);
        BoatResponse response = new BoatResponse(
                UUID.randomUUID(),
                ODYSSEY,
                OCEAN_CAPABLE,
                CAPTAIN,
                Instant.parse("2026-04-11T08:00:00Z")
        );
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .subject(CAPTAIN.toString())
                .build();

        when(boatService.create(request, CAPTAIN)).thenReturn(response);

        mockMvc.perform(post(API_BOATS)
                        .with(jwt().jwt(jwt))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath(NAME_PATH).value(ODYSSEY))
                .andExpect(jsonPath("$.createdBy").value(CAPTAIN.toString()));

        verify(boatService).create(request, CAPTAIN);
    }

    @Test
    void createShouldReturnUnauthorizedWhenJwtIsMissing() throws Exception {
        BoatRequest request = new BoatRequest(ODYSSEY, OCEAN_CAPABLE);

        mockMvc.perform(post(API_BOATS)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath(MESSAGE_PATH).value(AUTHENTICATION_REQUIRED))
                .andExpect(jsonPath(PATH_PATH).value(API_BOATS));

        verify(boatService, never()).create(any(), any());
    }

    @Test
    void createShouldReturnUnauthorizedWhenJwtSubjectIsBlank() throws Exception {
        BoatRequest request = new BoatRequest(ODYSSEY, OCEAN_CAPABLE);
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .subject(" ")
                .build();

        mockMvc.perform(post(API_BOATS)
                        .with(jwt().jwt(jwt))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath(MESSAGE_PATH).value(AUTHENTICATION_REQUIRED))
                .andExpect(jsonPath(PATH_PATH).value(API_BOATS));

        verify(boatService, never()).create(any(), any());
    }

    @Test
    void createShouldReturnValidationErrorWhenRequestBodyIsInvalid() throws Exception {
        mockMvc.perform(post(API_BOATS)
                        .with(jwt())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "",
                                  "description": "Valid description"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath(MESSAGE_PATH).value(VALIDATION_FAILED))
                .andExpect(jsonPath("$.fieldErrors.name").value("Name is required"));

        verify(boatService, never()).create(any(), any());
    }

    @Test
    void createShouldReturnBadRequestWhenJsonIsMalformed() throws Exception {
        mockMvc.perform(post(API_BOATS)
                        .with(jwt())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath(MESSAGE_PATH).value("Malformed JSON request"))
                .andExpect(jsonPath(PATH_PATH).value(API_BOATS));

        verify(boatService, never()).create(any(), any());
    }

    @Test
    void updateShouldReturnUpdatedBoatWhenRequestIsValid() throws Exception {
        UUID boatId = UUID.randomUUID();
        BoatRequest request = new BoatRequest(NEW_NAME, UPDATED_DESCRIPTION);
        BoatResponse response = new BoatResponse(
                boatId,
                NEW_NAME,
                UPDATED_DESCRIPTION,
                OWNER,
                Instant.parse("2026-04-01T10:30:00Z")
        );

        when(boatService.update(boatId, request)).thenReturn(response);

        mockMvc.perform(put(API_BOAT_BY_ID, boatId)
                        .with(jwt())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(boatId.toString()))
                .andExpect(jsonPath(NAME_PATH).value(NEW_NAME));

        verify(boatService).update(boatId, request);
    }

    @Test
    void updateShouldReturnNotFoundWhenBoatDoesNotExist() throws Exception {
        UUID boatId = UUID.randomUUID();
        BoatRequest request = new BoatRequest(NEW_NAME, UPDATED_DESCRIPTION);

        when(boatService.update(eq(boatId), any(BoatRequest.class))).thenThrow(new BoatNotFoundException(boatId));

        mockMvc.perform(put(API_BOAT_BY_ID, boatId)
                        .with(jwt())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath(MESSAGE_PATH).value("Boat not found with id: " + boatId))
                .andExpect(jsonPath(PATH_PATH).value(API_BOATS + "/" + boatId));
    }

    @Test
    void deleteShouldReturnNoContentWhenBoatExists() throws Exception {
        UUID boatId = UUID.randomUUID();

        mockMvc.perform(delete(API_BOAT_BY_ID, boatId)
                        .with(jwt()))
                .andExpect(status().isNoContent());

        verify(boatService).delete(boatId);
    }

    @Test
    void findByIdShouldReturnBadRequestWhenIdFormatIsInvalid() throws Exception {
        mockMvc.perform(get(API_BOAT_BY_ID, "not-a-uuid")
                        .with(jwt()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath(MESSAGE_PATH).value("Invalid parameter type"))
                .andExpect(jsonPath("$.fieldErrors.id").value("Expected UUID"));

        verify(boatService, never()).findById(any());
    }

    @Test
    void findAllShouldReturnUnauthorizedWhenJwtIsMissing() throws Exception {
        mockMvc.perform(get(API_BOATS))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath(MESSAGE_PATH).value(AUTHENTICATION_REQUIRED))
                .andExpect(jsonPath(PATH_PATH).value(API_BOATS));

        verify(boatService, never()).findAll(any());
    }

    @Test
    void findByIdShouldReturnUnauthorizedWhenJwtIsMissing() throws Exception {
        UUID boatId = UUID.randomUUID();

        mockMvc.perform(get(API_BOAT_BY_ID, boatId))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath(MESSAGE_PATH).value(AUTHENTICATION_REQUIRED));

        verify(boatService, never()).findById(any());
    }
}
