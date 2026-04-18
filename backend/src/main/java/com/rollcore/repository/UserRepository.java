package com.rollcore.repository;

import com.rollcore.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    /** Used for username-change uniqueness check that excludes the current user. */
    boolean existsByUsernameAndIdNot(String username, UUID id);
}
