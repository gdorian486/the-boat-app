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
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidationException;
import org.springframework.test.util.ReflectionTestUtils;

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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtDecoderConfigTest {

    private static final String ISSUER = "http://localhost:8081/realms/boat";
    private static final String AUDIENCE = "boat-api";
    private static final String CAPTAIN = "captain";
    private static final String PREFERRED_USERNAME = "preferred_username";

    private static HttpServer jwkServer;
    private static String jwkSetUri;
    private static RSAKey rsaJwk;

    @BeforeAll
    static void setUp() throws IOException, NoSuchAlgorithmException {
        rsaJwk = generateRsaJwk();
        jwkServer = HttpServer.create(new InetSocketAddress(0), 0);
        jwkServer.createContext("/jwks", JwtDecoderConfigTest::handleJwksRequest);
        jwkServer.start();
        jwkSetUri = "http://127.0.0.1:" + jwkServer.getAddress().getPort() + "/jwks";
    }

    @AfterAll
    static void tearDown() {
        if (jwkServer != null) {
            jwkServer.stop(0);
        }
    }

    @Test
    void jwtDecoderShouldAcceptTokenWhenSignatureIssuerAndAudienceAreValid() throws Exception {
        JwtDecoder decoder = newDecoder();
        String token = signedToken(ISSUER, List.of(AUDIENCE));

        Jwt jwt = decoder.decode(token);

        assertThat(jwt.getIssuer()).hasToString(ISSUER);
        assertThat(jwt.getAudience()).containsExactly(AUDIENCE);
        assertThat(jwt.getSubject()).isEqualTo(CAPTAIN);
    }

    @Test
    void jwtDecoderShouldRejectTokenWhenIssuerDoesNotMatch() throws Exception {
        JwtDecoder decoder = newDecoder();
        String token = signedToken("http://localhost:8081/realms/other", List.of(AUDIENCE));

        assertThatThrownBy(() -> decoder.decode(token))
                .isInstanceOf(JwtValidationException.class)
                .hasMessageContaining("iss");
    }

    @Test
    void jwtDecoderShouldRejectTokenWhenAudienceDoesNotMatch() throws Exception {
        JwtDecoder decoder = newDecoder();
        String token = signedToken(ISSUER, List.of("other-audience"));

        assertThatThrownBy(() -> decoder.decode(token))
                .isInstanceOf(JwtValidationException.class)
                .hasMessageContaining("aud");
    }

    private JwtDecoder newDecoder() {
        JwtDecoderConfig config = new JwtDecoderConfig();
        ReflectionTestUtils.setField(config, "issuerUri", ISSUER);
        ReflectionTestUtils.setField(config, "jwkSetUri", jwkSetUri);
        ReflectionTestUtils.setField(config, "audience", AUDIENCE);
        return config.jwtDecoder();
    }

    private static void handleJwksRequest(HttpExchange exchange) throws IOException {
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

    private static String signedToken(String issuer, List<String> audience) throws JOSEException {
        Instant now = Instant.now();
        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .issuer(issuer)
                .subject(CAPTAIN)
                .audience(audience)
                .issueTime(java.util.Date.from(now))
                .expirationTime(java.util.Date.from(now.plusSeconds(300)))
                .jwtID(UUID.randomUUID().toString())
                .claim(PREFERRED_USERNAME, CAPTAIN)
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
}
