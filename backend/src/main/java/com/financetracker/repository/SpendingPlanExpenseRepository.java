package com.financetracker.repository;

import com.financetracker.entity.SpendingPlanExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SpendingPlanExpenseRepository extends JpaRepository<SpendingPlanExpense, UUID> {

    List<SpendingPlanExpense> findByItemIdOrderByExpenseDateDesc(UUID itemId);

    @Query("SELECT e FROM SpendingPlanExpense e WHERE e.item.plan.id = :planId ORDER BY e.expenseDate DESC")
    List<SpendingPlanExpense> findByPlanIdOrderByExpenseDateDesc(@Param("planId") UUID planId);

    @Query("SELECT COUNT(DISTINCT e.user.id) FROM SpendingPlanExpense e WHERE e.item.plan.id = :planId")
    long countDistinctUsersByPlanId(@Param("planId") UUID planId);

    void deleteByItemId(UUID itemId);

    void deleteByUserId(UUID userId);
}
