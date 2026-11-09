package com.rollcore.service;

import com.rollcore.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

/** Daily purge of notifications older than 30 days (scheduling is enabled by RefreshTokenCleanup). */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationCleanup {

    static final Duration RETENTION = Duration.ofDays(30);

    private final NotificationRepository repository;

    @Scheduled(cron = "0 40 3 * * *")
    @Transactional
    public void purgeOld() {
        int n = repository.deleteCreatedBefore(Instant.now().minus(RETENTION));
        if (n > 0) log.info("Purged {} old notification(s)", n);
    }
}
