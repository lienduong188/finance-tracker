package com.financetracker.repository;

import com.financetracker.entity.Family;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FamilyRepository extends JpaRepository<Family, UUID> {

    @Query("SELECT DISTINCT f FROM Family f JOIN f.members m WHERE m.user.id = :userId")
    List<Family> findByMemberUserId(@Param("userId") UUID userId);

    Optional<Family> findByIdAndCreatedById(UUID id, UUID userId);

    @Query("SELECT f FROM Family f JOIN f.members m WHERE f.id = :familyId AND m.user.id = :userId")
    Optional<Family> findByIdAndMemberUserId(@Param("familyId") UUID familyId, @Param("userId") UUID userId);
}
