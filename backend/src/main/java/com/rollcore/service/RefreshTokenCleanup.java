package com.rollcore.service;

import com.rollcore.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

/** Daily purge of refresh-token rows that expired more than a day ago. */
@Slf4j
@Component
@EnableScheduling
@RequiredArgsConstructor
public class RefreshTokenCleanup {

    private final RefreshTokenRepository repository;

    @Scheduled(cron = "0 30 3 * * *")
    @Transactional
    public void purgeExpired() {
        int n = repository.deleteExpiredBefore(Instant.now().minus(Duration.ofDays(1)));
        if (n > 0) log.info("Purged {} expired refresh token(s)", n);
    }
}
