package com.interview.boat.security;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import com.interview.boat.TestcontainersConfiguration;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class SecurityIntegrationTest {

    private static final String API_BOATS = "/api/boats";
    private static final String ISSUER = "http://localhost:8081/realms/boat";
    private static final String AUDIENCE = "boat-api";
    private static final String ALLOWED_ORIGIN = "http://localhost:4200";
    private static final String AUTHENTICATION_REQUIRED = "Authentication required";
    private static final String CAPTAIN = "captain";
    private static final JwkFixture JWK_FIXTURE = JwkFixture.start();

    @Autowired
    private MockMvc mockMvc;

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.security.oauth2.resourceserver.jwt.issuer-uri", () -> ISSUER);
        registry.add("spring.security.oauth2.resourceserver.jwt.jwk-set-uri", JWK_FIXTURE::jwkSetUri);
        registry.add("jwt.audience", () -> AUDIENCE);
        registry.add("cors.allowed-origins", () -> ALLOWED_ORIGIN);
    }

    @AfterAll
    static void stopFixture() {
        JWK_FIXTURE.stop();
    }

    @Test
    void apiDocsShouldExposeBearerSecuritySchemeWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.components.securitySchemes.bearerAuth.type").value("http"))
                .andExpect(jsonPath("$.components.securitySchemes.bearerAuth.scheme").value("bearer"))
                .andExpect(jsonPath("$.components.securitySchemes.bearerAuth.bearerFormat").value("JWT"))
                .andExpect(jsonPath("$.security[0].bearerAuth").isArray());
    }

    @Test
    void swaggerUiShouldBeAccessibleWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/swagger-ui.html"))
                .andExpect(status().is3xxRedirection());
    }

    @Test
    void preflightRequestShouldReturnCorsHeadersForAllowedOrigin() throws Exception {
        mockMvc.perform(options(API_BOATS)
                        .header(HttpHeaders.ORIGIN, ALLOWED_ORIGIN)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "Authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, ALLOWED_ORIGIN))
                .andExpect(header().string(HttpHeaders.VARY, org.hamcrest.Matchers.containsString("Origin")));
    }

    @Test
    void protectedEndpointShouldAcceptValidSignedBearerToken() throws Exception {
        String token = JWK_FIXTURE.signedToken(ISSUER, List.of(AUDIENCE));

        mockMvc.perform(get(API_BOATS)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void protectedEndpointShouldRejectBearerTokenWhenAudienceDoesNotMatch() throws Exception {
        String token = JWK_FIXTURE.signedToken(ISSUER, List.of("other-audience"));

        mockMvc.perform(get(API_BOATS)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, org.hamcrest.Matchers.containsString("application/json")))
                .andExpect(jsonPath("$.message").value(AUTHENTICATION_REQUIRED))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.path").value(API_BOATS));
    }

    private static final class JwkFixture {
        private final HttpServer server;
        private final RSAKey rsaJwk;

        private JwkFixture(HttpServer server, RSAKey rsaJwk) {
            this.server = server;
            this.rsaJwk = rsaJwk;
        }

        static JwkFixture start() {
            try {
                RSAKey rsaJwk = generateRsaJwk();
                HttpServer server = HttpServer.create(new InetSocketAddress(0), 0);
                server.createContext("/jwks", exchange -> handleJwksRequest(exchange, rsaJwk));
                server.start();
                return new JwkFixture(server, rsaJwk);
            } catch (IOException | NoSuchAlgorithmException exception) {
                throw new IllegalStateException("Failed to start JWK fixture", exception);
            }
        }

        String jwkSetUri() {
            return "http://127.0.0.1:" + server.getAddress().getPort() + "/jwks";
        }

        String signedToken(String issuer, List<String> audience) throws JOSEException {
            Instant now = Instant.now();
            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .issuer(issuer)
                    .subject(CAPTAIN)
                    .audience(audience)
                    .issueTime(java.util.Date.from(now))
                    .expirationTime(java.util.Date.from(now.plusSeconds(300)))
                    .jwtID(UUID.randomUUID().toString())
                    .claim("scope", "openid profile email")
                    .claim("preferred_username", CAPTAIN)
                    .build();

            SignedJWT signedJwt = new SignedJWT(
                    new JWSHeader.Builder(JWSAlgorithm.RS256)
                            .type(JOSEObjectType.JWT)
                            .keyID(rsaJwk.getKeyID())
                            .build(),
                    claimsSet
            );
            signedJwt.sign(new RSASSASigner(rsaJwk));
            return signedJwt.serialize();
        }

        void stop() {
            server.stop(0);
        }

        private static void handleJwksRequest(HttpExchange exchange, RSAKey rsaJwk) throws IOException {
            byte[] response = new JWKSet(rsaJwk.toPublicJWK()).toString().getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.length);
            try (OutputStream outputStream = exchange.getResponseBody()) {
                outputStream.write(response);
            } finally {
                exchange.close();
            }
        }

        private static RSAKey generateRsaJwk() throws NoSuchAlgorithmException {
            KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
            keyPairGenerator.initialize(2048);
            KeyPair keyPair = keyPairGenerator.generateKeyPair();
            return new RSAKey.Builder((RSAPublicKey) keyPair.getPublic())
                    .privateKey((RSAPrivateKey) keyPair.getPrivate())
                    .keyID(UUID.randomUUID().toString())
                    .build();
        }
    }
}
