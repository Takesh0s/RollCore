package com.rollcore.repository;

import com.rollcore.entity.StoredImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface StoredImageRepository extends JpaRepository<StoredImage, UUID> {

    long countByOwnerId(UUID ownerId);
}
