package com.interview.boat.exception;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GlobalExceptionHandlerTest {

    private static final String TEST_BOATS = "/test/boats";
    private static final String TEST_BOAT_BY_ID = "/test/boats/{id}";
    private static final String VALIDATION_FAILED = "Validation failed";
    private static final String AUTHENTICATION_REQUIRED = "Authentication required";
    private static final String MESSAGE_PATH = "$.message";
    private static final String STATUS_PATH = "$.status";
    private static final String PATH_PATH = "$.path";

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new TestController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void shouldReturnNotFoundPayloadForBoatNotFoundException() throws Exception {
        UUID boatId = UUID.randomUUID();

        mockMvc.perform(get(TEST_BOAT_BY_ID, boatId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath(MESSAGE_PATH).value("Boat not found with id: " + boatId))
                .andExpect(jsonPath(STATUS_PATH).value(404))
                .andExpect(jsonPath(PATH_PATH).value(TEST_BOATS + "/" + boatId));
    }

    @Test
    void shouldReturnValidationPayloadForInvalidRequestBody() throws Exception {
        mockMvc.perform(post(TEST_BOATS)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": ""
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath(MESSAGE_PATH).value(VALIDATION_FAILED))
                .andExpect(jsonPath(STATUS_PATH).value(400))
                .andExpect(jsonPath(PATH_PATH).value(TEST_BOATS))
                .andExpect(jsonPath("$.fieldErrors.name").value("Name is required"));
    }

    @Test
    void shouldReturnInternalServerErrorPayloadForUnexpectedException() throws Exception {
        mockMvc.perform(get("/test/unexpected"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath(MESSAGE_PATH).value("An unexpected error occurred"))
                .andExpect(jsonPath(STATUS_PATH).value(500))
                .andExpect(jsonPath(PATH_PATH).value("/test/unexpected"));
    }

    @Test
    void shouldReturnBadRequestPayloadForMethodArgumentTypeMismatch() throws Exception {
        mockMvc.perform(get("/test/uuid/{id}", "not-a-uuid"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath(MESSAGE_PATH).value("Invalid parameter type"))
                .andExpect(jsonPath(STATUS_PATH).value(400))
                .andExpect(jsonPath(PATH_PATH).value("/test/uuid/not-a-uuid"))
                .andExpect(jsonPath("$.fieldErrors.id").value("Expected UUID"));
    }

    @Test
    void shouldReturnBadRequestPayloadForMalformedJson() throws Exception {
        mockMvc.perform(post(TEST_BOATS)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath(MESSAGE_PATH).value("Malformed JSON request"))
                .andExpect(jsonPath(STATUS_PATH).value(400))
                .andExpect(jsonPath(PATH_PATH).value(TEST_BOATS));
    }

    @Test
    void shouldReturnUnauthorizedPayloadForAuthenticationException() throws Exception {
        mockMvc.perform(get("/test/auth"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath(MESSAGE_PATH).value(AUTHENTICATION_REQUIRED))
                .andExpect(jsonPath(STATUS_PATH).value(401))
                .andExpect(jsonPath(PATH_PATH).value("/test/auth"));
    }

    @RestController
    @Validated
    static class TestController {

        @GetMapping(TEST_BOAT_BY_ID)
        void boatNotFound(@PathVariable UUID id) {
            throw new BoatNotFoundException(id);
        }

        @PostMapping(TEST_BOATS)
        TestRequest create(@Valid @RequestBody TestRequest request) {
            return request;
        }

        @GetMapping("/test/uuid/{id}")
        UUID uuid(@PathVariable UUID id) {
            return id;
        }

        @GetMapping("/test/auth")
        void auth() {
            throw new AuthenticationCredentialsNotFoundException("Authentication is required");
        }

        @GetMapping("/test/unexpected")
        void unexpected() {
            throw new IllegalStateException("unexpected");
        }
    }

    record TestRequest(
            @NotBlank(message = "Name is required")
            String name
    ) {
    }
}
