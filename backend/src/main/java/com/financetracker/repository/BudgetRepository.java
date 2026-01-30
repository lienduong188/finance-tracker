package com.financetracker.repository;

import com.financetracker.entity.Budget;
import com.financetracker.entity.BudgetPeriod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, UUID> {

    List<Budget> findByUserIdAndIsActiveTrue(UUID userId);

    List<Budget> findByUserId(UUID userId);

    Optional<Budget> findByIdAndUserId(UUID id, UUID userId);

    List<Budget> findByUserIdAndPeriod(UUID userId, BudgetPeriod period);

    @Query("SELECT b FROM Budget b WHERE b.user.id = :userId AND b.isActive = true " +
           "AND b.startDate <= :date AND (b.endDate IS NULL OR b.endDate >= :date)")
    List<Budget> findActiveBudgetsForDate(@Param("userId") UUID userId, @Param("date") LocalDate date);

    @Query("SELECT b FROM Budget b WHERE b.user.id = :userId AND b.category.id = :categoryId AND b.isActive = true")
    List<Budget> findByCategoryIdAndActive(@Param("userId") UUID userId, @Param("categoryId") UUID categoryId);

    // Family budgets
    List<Budget> findByFamilyId(UUID familyId);

    List<Budget> findByFamilyIdAndIsActiveTrue(UUID familyId);

    Optional<Budget> findByIdAndFamilyId(UUID id, UUID familyId);

    // Find all accessible budgets (user's personal + family budgets)
    @Query("SELECT b FROM Budget b WHERE b.user.id = :userId OR b.family.id IN :familyIds")
    List<Budget> findAccessibleBudgets(@Param("userId") UUID userId, @Param("familyIds") List<UUID> familyIds);

    @Query("SELECT b FROM Budget b WHERE (b.user.id = :userId OR b.family.id IN :familyIds) AND b.isActive = true")
    List<Budget> findAccessibleActiveBudgets(@Param("userId") UUID userId, @Param("familyIds") List<UUID> familyIds);

    void deleteByUserId(UUID userId);
}
