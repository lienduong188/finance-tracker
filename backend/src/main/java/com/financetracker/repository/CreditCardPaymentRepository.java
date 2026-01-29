package com.financetracker.repository;

import com.financetracker.entity.CreditCardPayment;
import com.financetracker.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CreditCardPaymentRepository extends JpaRepository<CreditCardPayment, UUID> {

    List<CreditCardPayment> findByPlanIdOrderByPaymentNumber(UUID planId);

    Optional<CreditCardPayment> findByIdAndPlanId(UUID id, UUID planId);

    List<CreditCardPayment> findByPlanIdAndStatus(UUID planId, PaymentStatus status);

    @Query("SELECT p FROM CreditCardPayment p WHERE p.plan.user.id = :userId AND p.status = 'PENDING' AND p.dueDate BETWEEN :startDate AND :endDate ORDER BY p.dueDate")
    List<CreditCardPayment> findUpcomingPayments(
            @Param("userId") UUID userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT p FROM CreditCardPayment p WHERE p.status = 'PENDING' AND p.dueDate < :date")
    List<CreditCardPayment> findOverduePayments(@Param("date") LocalDate date);

    @Modifying
    @Query("UPDATE CreditCardPayment p SET p.status = 'OVERDUE' WHERE p.status = 'PENDING' AND p.dueDate < :date")
    int markOverduePayments(@Param("date") LocalDate date);

    @Query("SELECT COUNT(p) FROM CreditCardPayment p WHERE p.plan.user.id = :userId AND p.status = 'PENDING'")
    long countPendingPayments(@Param("userId") UUID userId);

    Optional<CreditCardPayment> findFirstByPlanIdAndStatusOrderByPaymentNumber(UUID planId, PaymentStatus status);
}
