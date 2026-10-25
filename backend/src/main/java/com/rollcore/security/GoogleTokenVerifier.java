package com.rollcore.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Validates Google ID tokens ("Sign in with Google").
 *
 * <p>The token is checked by Google's {@code tokeninfo} endpoint, which verifies the
 * signature and the expiry. This class then enforces the claims that matter to us:
 * audience (our own OAuth client id), issuer, verified e-mail and expiry.
 *
 * <p>Allowed client ids come from {@code google.client-ids} (comma separated), so a
 * web and an Android client can coexist. With none configured every token is
 * rejected, which keeps the feature switched off by default.
 */
@Component
public class GoogleTokenVerifier {

    private static final Logger log = LoggerFactory.getLogger(GoogleTokenVerifier.class);

    private static final String TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token=";
    private static final Set<String> ISSUERS = Set.of("accounts.google.com", "https://accounts.google.com");

    private final Set<String> allowedClientIds;
    private final Function<String, String> fetcher;
    private final ObjectMapper mapper = new ObjectMapper();

    @Autowired
    public GoogleTokenVerifier(@Value("${google.client-ids:}") String clientIds) {
        this(clientIds, new HttpFetcher());
    }

    /** Test seam: {@code fetcher} returns the tokeninfo JSON, or {@code null} when Google rejects the token. */
    GoogleTokenVerifier(String clientIds, Function<String, String> fetcher) {
        this.allowedClientIds = Arrays.stream(clientIds == null ? new String[0] : clientIds.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toUnmodifiableSet());
        this.fetcher = fetcher;
        if (allowedClientIds.isEmpty()) {
            log.warn("google.client-ids is empty: Google sign-in is disabled.");
        }
    }

    /**
     * @throws BadCredentialsException when the token is missing, rejected by Google or fails a claim check.
     */
    public GoogleIdentity verify(String idToken) {
        if (allowedClientIds.isEmpty() || idToken == null || idToken.isBlank()) {
            throw invalid();
        }

        String body = fetcher.apply(idToken);
        if (body == null) {
            throw invalid();
        }

        JsonNode claims;
        try {
            claims = mapper.readTree(body);
        } catch (IOException e) {
            throw invalid();
        }

        String audience = text(claims, "aud");
        String issuer   = text(claims, "iss");
        String subject  = text(claims, "sub");
        String email    = text(claims, "email");

        boolean emailVerified = "true".equalsIgnoreCase(text(claims, "email_verified"));
        boolean expired       = !isFuture(text(claims, "exp"));

        if (!allowedClientIds.contains(audience)
                || !ISSUERS.contains(issuer)
                || subject.isEmpty() || email.isEmpty()
                || !emailVerified || expired) {
            throw invalid();
        }

        return new GoogleIdentity(subject, email.toLowerCase(), text(claims, "name"));
    }

    private static boolean isFuture(String epochSeconds) {
        try {
            return Long.parseLong(epochSeconds) > Instant.now().getEpochSecond();
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private static String text(JsonNode node, String field) {
        JsonNode v = node.get(field);
        return v == null || v.isNull() ? "" : v.asText("");
    }

    private static BadCredentialsException invalid() {
        return new BadCredentialsException("Invalid Google token.");
    }

    /** Production fetcher: GET tokeninfo; HTTP 400 means the token is invalid or expired. */
    private static final class HttpFetcher implements Function<String, String> {

        private final HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();

        @Override
        public String apply(String idToken) {
            HttpRequest request = HttpRequest.newBuilder(URI.create(
                            TOKENINFO_URL + URLEncoder.encode(idToken, StandardCharsets.UTF_8)))
                    .timeout(Duration.ofSeconds(5))
                    .GET()
                    .build();
            try {
                HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() == 200) {
                    return response.body();
                }
                if (response.statusCode() == 400) {
                    return null;
                }
                throw new IllegalStateException("Google tokeninfo returned HTTP " + response.statusCode());
            } catch (IOException e) {
                throw new IllegalStateException("Could not reach Google tokeninfo", e);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("Interrupted while verifying Google token", e);
            }
        }
    }
}
