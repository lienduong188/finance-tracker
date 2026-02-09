package com.financetracker.repository;

import com.financetracker.entity.SpendingPlan;
import com.financetracker.entity.SpendingPlanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SpendingPlanRepository extends JpaRepository<SpendingPlan, UUID> {

    List<SpendingPlan> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<SpendingPlan> findByUserIdAndStatusOrderByCreatedAtDesc(UUID userId, SpendingPlanStatus status);

    List<SpendingPlan> findByFamilyIdOrderByCreatedAtDesc(UUID familyId);

    @Query("SELECT sp FROM SpendingPlan sp WHERE sp.user.id = :userId OR sp.family.id IN :familyIds ORDER BY sp.createdAt DESC")
    List<SpendingPlan> findAccessiblePlans(@Param("userId") UUID userId, @Param("familyIds") List<UUID> familyIds);

    @Query("SELECT sp FROM SpendingPlan sp WHERE (sp.user.id = :userId OR sp.family.id IN :familyIds) AND sp.status = :status ORDER BY sp.createdAt DESC")
    List<SpendingPlan> findAccessiblePlansByStatus(@Param("userId") UUID userId, @Param("familyIds") List<UUID> familyIds, @Param("status") SpendingPlanStatus status);

    void deleteByUserIdAndFamilyIsNull(UUID userId);

    void deleteByFamilyId(UUID familyId);
}
