package com.rollcore.repository;

import com.rollcore.entity.StoredImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface StoredImageRepository extends JpaRepository<StoredImage, UUID> {

    long countByOwnerId(UUID ownerId);

    /** Ownership check that does not load the picture bytes. */
    boolean existsByIdAndOwnerId(UUID id, UUID ownerId);

    /** Deletes the picture only when {@code ownerId} uploaded it; does not load the bytes. */
    @Modifying
    @Query("delete from StoredImage i where i.id = :id and i.owner.id = :ownerId")
    int deleteOwned(@Param("id") UUID id, @Param("ownerId") UUID ownerId);
}
