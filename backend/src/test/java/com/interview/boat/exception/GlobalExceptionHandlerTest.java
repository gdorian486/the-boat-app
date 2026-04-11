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

        mockMvc.perform(get("/test/boats/{id}", boatId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Boat not found with id: " + boatId))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.path").value("/test/boats/" + boatId));
    }

    @Test
    void shouldReturnValidationPayloadForInvalidRequestBody() throws Exception {
        mockMvc.perform(post("/test/boats")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": ""
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.path").value("/test/boats"))
                .andExpect(jsonPath("$.fieldErrors.name").value("Name is required"));
    }

    @Test
    void shouldReturnInternalServerErrorPayloadForUnexpectedException() throws Exception {
        mockMvc.perform(get("/test/unexpected"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("An unexpected error occurred"))
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.path").value("/test/unexpected"));
    }

    @Test
    void shouldReturnBadRequestPayloadForMethodArgumentTypeMismatch() throws Exception {
        mockMvc.perform(get("/test/uuid/{id}", "not-a-uuid"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid parameter type"))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.path").value("/test/uuid/not-a-uuid"))
                .andExpect(jsonPath("$.fieldErrors.id").value("Expected UUID"));
    }

    @Test
    void shouldReturnBadRequestPayloadForMalformedJson() throws Exception {
        mockMvc.perform(post("/test/boats")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Malformed JSON request"))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.path").value("/test/boats"));
    }

    @Test
    void shouldReturnUnauthorizedPayloadForAuthenticationException() throws Exception {
        mockMvc.perform(get("/test/auth"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Authentication required"))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.path").value("/test/auth"));
    }

    @RestController
    @Validated
    static class TestController {

        @GetMapping("/test/boats/{id}")
        void boatNotFound(@PathVariable UUID id) {
            throw new BoatNotFoundException(id);
        }

        @PostMapping("/test/boats")
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
