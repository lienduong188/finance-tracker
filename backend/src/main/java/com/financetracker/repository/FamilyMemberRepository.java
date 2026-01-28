package com.financetracker.repository;

import com.financetracker.entity.FamilyMember;
import com.financetracker.entity.FamilyRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FamilyMemberRepository extends JpaRepository<FamilyMember, UUID> {

    Optional<FamilyMember> findByFamilyIdAndUserId(UUID familyId, UUID userId);

    List<FamilyMember> findByFamilyId(UUID familyId);

    List<FamilyMember> findByUserId(UUID userId);

    boolean existsByFamilyIdAndUserId(UUID familyId, UUID userId);

    @Query("SELECT m FROM FamilyMember m WHERE m.family.id = :familyId AND m.role IN :roles")
    List<FamilyMember> findByFamilyIdAndRoleIn(@Param("familyId") UUID familyId, @Param("roles") List<FamilyRole> roles);

    @Query("SELECT m FROM FamilyMember m WHERE m.family.id = :familyId AND m.role = :role")
    Optional<FamilyMember> findByFamilyIdAndRole(@Param("familyId") UUID familyId, @Param("role") FamilyRole role);

    void deleteByFamilyIdAndUserId(UUID familyId, UUID userId);
}
