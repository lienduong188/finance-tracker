package com.financetracker.repository;

import com.financetracker.entity.SavingsGoal;
import com.financetracker.entity.SavingsGoalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SavingsGoalRepository extends JpaRepository<SavingsGoal, UUID> {

    List<SavingsGoal> findByUserId(UUID userId);

    List<SavingsGoal> findByUserIdAndStatus(UUID userId, SavingsGoalStatus status);

    List<SavingsGoal> findByFamilyId(UUID familyId);

    List<SavingsGoal> findByFamilyIdAndStatus(UUID familyId, SavingsGoalStatus status);

    Optional<SavingsGoal> findByIdAndUserId(UUID id, UUID userId);

    Optional<SavingsGoal> findByIdAndFamilyId(UUID id, UUID familyId);

    @Query("SELECT sg FROM SavingsGoal sg WHERE sg.user.id = :userId OR sg.family.id IN :familyIds")
    List<SavingsGoal> findAccessibleGoals(@Param("userId") UUID userId, @Param("familyIds") List<UUID> familyIds);

    @Query("SELECT sg FROM SavingsGoal sg WHERE (sg.user.id = :userId OR sg.family.id IN :familyIds) AND sg.status = :status")
    List<SavingsGoal> findAccessibleGoalsByStatus(@Param("userId") UUID userId, @Param("familyIds") List<UUID> familyIds, @Param("status") SavingsGoalStatus status);
}
