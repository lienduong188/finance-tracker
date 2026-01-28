package com.financetracker.repository;

import com.financetracker.entity.Debt;
import com.financetracker.entity.DebtStatus;
import com.financetracker.entity.DebtType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DebtRepository extends JpaRepository<Debt, UUID> {

    Page<Debt> findByUserId(UUID userId, Pageable pageable);

    Page<Debt> findByUserIdAndType(UUID userId, DebtType type, Pageable pageable);

    Page<Debt> findByUserIdAndStatus(UUID userId, DebtStatus status, Pageable pageable);

    Page<Debt> findByUserIdAndTypeAndStatus(UUID userId, DebtType type, DebtStatus status, Pageable pageable);

    Optional<Debt> findByIdAndUserId(UUID id, UUID userId);

    List<Debt> findByUserIdAndStatusIn(UUID userId, List<DebtStatus> statuses);

    @Query("SELECT d FROM Debt d WHERE d.user.id = :userId AND d.status IN ('ACTIVE', 'PARTIALLY_PAID') AND d.dueDate <= :date")
    List<Debt> findOverdueDebts(@Param("userId") UUID userId, @Param("date") LocalDate date);

    @Query("SELECT SUM(d.amount - d.paidAmount) FROM Debt d WHERE d.user.id = :userId AND d.type = :type AND d.status IN ('ACTIVE', 'PARTIALLY_PAID')")
    BigDecimal sumOutstandingByType(@Param("userId") UUID userId, @Param("type") DebtType type);

    @Query("SELECT COUNT(d) FROM Debt d WHERE d.user.id = :userId AND d.status IN ('ACTIVE', 'PARTIALLY_PAID')")
    long countActiveDebts(@Param("userId") UUID userId);

    @Query("SELECT d FROM Debt d WHERE d.dueDate BETWEEN :startDate AND :endDate AND d.status = :status")
    List<Debt> findByDueDateBetweenAndStatus(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("status") DebtStatus status);
}
