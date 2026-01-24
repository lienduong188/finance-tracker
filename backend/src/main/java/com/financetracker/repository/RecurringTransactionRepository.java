package com.financetracker.repository;

import com.financetracker.entity.RecurringStatus;
import com.financetracker.entity.RecurringTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RecurringTransactionRepository extends JpaRepository<RecurringTransaction, UUID> {

    Page<RecurringTransaction> findByUserId(UUID userId, Pageable pageable);

    Page<RecurringTransaction> findByUserIdAndStatus(UUID userId, RecurringStatus status, Pageable pageable);

    List<RecurringTransaction> findByUserIdAndStatusOrderByNextExecutionDateAsc(UUID userId, RecurringStatus status);

    Optional<RecurringTransaction> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT r FROM RecurringTransaction r " +
           "WHERE r.status = 'ACTIVE' " +
           "AND r.nextExecutionDate <= :today " +
           "AND (r.endDate IS NULL OR r.endDate >= :today)")
    List<RecurringTransaction> findDueForExecution(@Param("today") LocalDate today);

    @Query("SELECT r FROM RecurringTransaction r " +
           "WHERE r.user.id = :userId " +
           "AND r.status = 'ACTIVE' " +
           "AND r.nextExecutionDate <= :untilDate " +
           "ORDER BY r.nextExecutionDate ASC")
    List<RecurringTransaction> findUpcoming(
            @Param("userId") UUID userId,
            @Param("untilDate") LocalDate untilDate);

    long countByUserIdAndStatus(UUID userId, RecurringStatus status);
}
