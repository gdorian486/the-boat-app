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
                "alice",
                Instant.parse("2026-04-11T10:00:00Z")
        );
        PageRequest expectedPageRequest = PageRequest.of(1, 5, Sort.by(Sort.Direction.DESC, "createdAt"));

        when(boatService.findAll(expectedPageRequest))
                .thenReturn(new PageImpl<>(List.of(boat), expectedPageRequest, 6));

        mockMvc.perform(get("/api/boats")
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
        mockMvc.perform(get("/api/boats")
                        .param("page", "-1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.fieldErrors.page").value("Page must be greater than or equal to 0"));

        verify(boatService, never()).findAll(any());
    }

    @Test
    void findAllShouldReturnValidationErrorWhenSizeExceedsMaximum() throws Exception {
        mockMvc.perform(get("/api/boats")
                        .param("size", "101"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.fieldErrors.size").value("Size must be less than or equal to 100"));

        verify(boatService, never()).findAll(any());
    }

    @Test
    void findAllShouldReturnValidationErrorWhenSizeIsZero() throws Exception {
        mockMvc.perform(get("/api/boats")
                        .param("size", "0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
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
                "bob",
                Instant.parse("2026-04-09T12:00:00Z")
        );

        when(boatService.findById(boatId)).thenReturn(response);

        mockMvc.perform(get("/api/boats/{id}", boatId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(boatId.toString()))
                .andExpect(jsonPath("$.name").value("Skylark"))
                .andExpect(jsonPath("$.createdBy").value("bob"));
    }

    @Test
    void findByIdShouldReturnNotFoundPayloadWhenBoatDoesNotExist() throws Exception {
        UUID boatId = UUID.randomUUID();

        when(boatService.findById(boatId)).thenThrow(new BoatNotFoundException(boatId));

        mockMvc.perform(get("/api/boats/{id}", boatId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Boat not found with id: " + boatId))
                .andExpect(jsonPath("$.path").value("/api/boats/" + boatId));
    }

    @Test
    void createShouldReturnCreatedBoatWhenJwtSubjectIsPresent() throws Exception {
        BoatRequest request = new BoatRequest("Odyssey", "Ocean capable");
        BoatResponse response = new BoatResponse(
                UUID.randomUUID(),
                "Odyssey",
                "Ocean capable",
                "captain",
                Instant.parse("2026-04-11T08:00:00Z")
        );
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .subject("captain")
                .build();

        when(boatService.create(request, "captain")).thenReturn(response);

        mockMvc.perform(post("/api/boats")
                        .with(jwt().jwt(jwt))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Odyssey"))
                .andExpect(jsonPath("$.createdBy").value("captain"));

        verify(boatService).create(request, "captain");
    }

    @Test
    void createShouldReturnUnauthorizedWhenJwtIsMissing() throws Exception {
        BoatRequest request = new BoatRequest("Odyssey", "Ocean capable");

        mockMvc.perform(post("/api/boats")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Authentication required"))
                .andExpect(jsonPath("$.path").value("/api/boats"));

        verify(boatService, never()).create(any(), any());
    }

    @Test
    void createShouldReturnUnauthorizedWhenJwtSubjectIsBlank() throws Exception {
        BoatRequest request = new BoatRequest("Odyssey", "Ocean capable");
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .subject(" ")
                .build();

        mockMvc.perform(post("/api/boats")
                        .with(jwt().jwt(jwt))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Authentication required"))
                .andExpect(jsonPath("$.path").value("/api/boats"));

        verify(boatService, never()).create(any(), any());
    }

    @Test
    void createShouldReturnValidationErrorWhenRequestBodyIsInvalid() throws Exception {
        mockMvc.perform(post("/api/boats")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "",
                                  "description": "Valid description"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.fieldErrors.name").value("Name is required"));

        verify(boatService, never()).create(any(), any());
    }

    @Test
    void createShouldReturnBadRequestWhenJsonIsMalformed() throws Exception {
        mockMvc.perform(post("/api/boats")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Malformed JSON request"))
                .andExpect(jsonPath("$.path").value("/api/boats"));

        verify(boatService, never()).create(any(), any());
    }

    @Test
    void updateShouldReturnUpdatedBoatWhenRequestIsValid() throws Exception {
        UUID boatId = UUID.randomUUID();
        BoatRequest request = new BoatRequest("New Name", "Updated description");
        BoatResponse response = new BoatResponse(
                boatId,
                "New Name",
                "Updated description",
                "owner",
                Instant.parse("2026-04-01T10:30:00Z")
        );

        when(boatService.update(boatId, request)).thenReturn(response);

        mockMvc.perform(put("/api/boats/{id}", boatId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(boatId.toString()))
                .andExpect(jsonPath("$.name").value("New Name"));

        verify(boatService).update(boatId, request);
    }

    @Test
    void updateShouldReturnNotFoundWhenBoatDoesNotExist() throws Exception {
        UUID boatId = UUID.randomUUID();
        BoatRequest request = new BoatRequest("New Name", "Updated description");

        when(boatService.update(eq(boatId), any(BoatRequest.class))).thenThrow(new BoatNotFoundException(boatId));

        mockMvc.perform(put("/api/boats/{id}", boatId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Boat not found with id: " + boatId))
                .andExpect(jsonPath("$.path").value("/api/boats/" + boatId));
    }

    @Test
    void deleteShouldReturnNoContentWhenBoatExists() throws Exception {
        UUID boatId = UUID.randomUUID();

        mockMvc.perform(delete("/api/boats/{id}", boatId))
                .andExpect(status().isNoContent());

        verify(boatService).delete(boatId);
    }

    @Test
    void findByIdShouldReturnBadRequestWhenIdFormatIsInvalid() throws Exception {
        mockMvc.perform(get("/api/boats/{id}", "not-a-uuid"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid parameter type"))
                .andExpect(jsonPath("$.fieldErrors.id").value("Expected UUID"));

        verify(boatService, never()).findById(any());
    }
}
