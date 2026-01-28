package com.financetracker.repository;

import com.financetracker.entity.SavingsContribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface SavingsContributionRepository extends JpaRepository<SavingsContribution, UUID> {

    List<SavingsContribution> findByGoalIdOrderByContributionDateDesc(UUID goalId);

    List<SavingsContribution> findByGoalIdAndUserId(UUID goalId, UUID userId);

    List<SavingsContribution> findByUserId(UUID userId);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM SavingsContribution c WHERE c.goal.id = :goalId")
    BigDecimal sumAmountByGoalId(@Param("goalId") UUID goalId);

    @Query("SELECT c.user.id, c.user.fullName, COALESCE(SUM(c.amount), 0) FROM SavingsContribution c WHERE c.goal.id = :goalId GROUP BY c.user.id, c.user.fullName")
    List<Object[]> sumAmountByGoalIdGroupByUser(@Param("goalId") UUID goalId);

    long countByGoalId(UUID goalId);

    @Query("SELECT COUNT(DISTINCT c.user.id) FROM SavingsContribution c WHERE c.goal.id = :goalId")
    long countDistinctUsersByGoalId(@Param("goalId") UUID goalId);
}
