package com.financetracker.repository;

import com.financetracker.entity.SpendingPlanItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SpendingPlanItemRepository extends JpaRepository<SpendingPlanItem, UUID> {

    List<SpendingPlanItem> findByPlanIdOrderBySortOrderAsc(UUID planId);

    @Query("SELECT COALESCE(MAX(i.sortOrder), 0) FROM SpendingPlanItem i WHERE i.plan.id = :planId")
    Integer findMaxSortOrderByPlanId(@Param("planId") UUID planId);

    void deleteByPlanId(UUID planId);
}
