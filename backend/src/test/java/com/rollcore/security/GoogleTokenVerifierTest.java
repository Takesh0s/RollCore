package com.rollcore.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("GoogleTokenVerifier")
class GoogleTokenVerifierTest {

    private static final String CLIENT_ID = "client-123.apps.googleusercontent.com";

    private static String claims(String aud, String iss, String emailVerified, long exp) {
        return """
                {"aud":"%s","iss":"%s","sub":"110169484474386276334",
                 "email":"Player@Gmail.com","email_verified":"%s","name":"Player One","exp":"%d"}
                """.formatted(aud, iss, emailVerified, exp);
    }

    private static long inOneHour() { return Instant.now().getEpochSecond() + 3600; }

    private GoogleTokenVerifier verifier(String clientIds, String body) {
        return new GoogleTokenVerifier(clientIds, token -> body);
    }

    @Test @DisplayName("accepts a valid token and normalises the e-mail")
    void valid() {
        GoogleIdentity id = verifier(CLIENT_ID,
                claims(CLIENT_ID, "https://accounts.google.com", "true", inOneHour())).verify("tok");

        assertThat(id.subject()).isEqualTo("110169484474386276334");
        assertThat(id.email()).isEqualTo("player@gmail.com");
        assertThat(id.name()).isEqualTo("Player One");
    }

    @Test @DisplayName("accepts the bare issuer form and any configured client id")
    void bareIssuerAndSecondClient() {
        GoogleTokenVerifier v = verifier("other-client , " + CLIENT_ID,
                claims(CLIENT_ID, "accounts.google.com", "true", inOneHour()));

        assertThat(v.verify("tok").subject()).isNotEmpty();
    }

    @Test @DisplayName("rejects a token issued for another client id")
    void wrongAudience() {
        assertRejected(verifier(CLIENT_ID,
                claims("someone-else", "https://accounts.google.com", "true", inOneHour())));
    }

    @Test @DisplayName("rejects an unexpected issuer")
    void wrongIssuer() {
        assertRejected(verifier(CLIENT_ID, claims(CLIENT_ID, "https://evil.example", "true", inOneHour())));
    }

    @Test @DisplayName("rejects an unverified e-mail")
    void unverifiedEmail() {
        assertRejected(verifier(CLIENT_ID,
                claims(CLIENT_ID, "https://accounts.google.com", "false", inOneHour())));
    }

    @Test @DisplayName("rejects an expired token")
    void expired() {
        assertRejected(verifier(CLIENT_ID,
                claims(CLIENT_ID, "https://accounts.google.com", "true", Instant.now().getEpochSecond() - 10)));
    }

    @Test @DisplayName("rejects a token Google refuses (fetcher returns null)")
    void rejectedByGoogle() {
        assertRejected(new GoogleTokenVerifier(CLIENT_ID, token -> null));
    }

    @Test @DisplayName("rejects a malformed response body")
    void malformedBody() {
        assertRejected(verifier(CLIENT_ID, "not json"));
    }

    @Test @DisplayName("rejects everything when no client id is configured")
    void featureDisabled() {
        assertRejected(verifier("", claims(CLIENT_ID, "https://accounts.google.com", "true", inOneHour())));
        assertRejected(verifier(null, claims(CLIENT_ID, "https://accounts.google.com", "true", inOneHour())));
    }

    @Test @DisplayName("rejects a blank token without calling Google")
    void blankToken() {
        GoogleTokenVerifier v = new GoogleTokenVerifier(CLIENT_ID, token -> {
            throw new AssertionError("must not be called");
        });

        assertThatThrownBy(() -> v.verify("  ")).isInstanceOf(BadCredentialsException.class);
        assertThatThrownBy(() -> v.verify(null)).isInstanceOf(BadCredentialsException.class);
    }

    private static void assertRejected(GoogleTokenVerifier v) {
        assertThatThrownBy(() -> v.verify("tok")).isInstanceOf(BadCredentialsException.class);
    }
}
