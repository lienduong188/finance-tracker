package com.financetracker.repository;

import com.financetracker.entity.CreditCardPaymentPlan;
import com.financetracker.entity.PaymentPlanStatus;
import com.financetracker.entity.PaymentType;
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
public interface CreditCardPaymentPlanRepository extends JpaRepository<CreditCardPaymentPlan, UUID> {

    Page<CreditCardPaymentPlan> findByUserId(UUID userId, Pageable pageable);

    Page<CreditCardPaymentPlan> findByUserIdAndStatus(UUID userId, PaymentPlanStatus status, Pageable pageable);

    Page<CreditCardPaymentPlan> findByUserIdAndPaymentType(UUID userId, PaymentType paymentType, Pageable pageable);

    Page<CreditCardPaymentPlan> findByUserIdAndStatusAndPaymentType(
            UUID userId, PaymentPlanStatus status, PaymentType paymentType, Pageable pageable);

    // Filter by account
    Page<CreditCardPaymentPlan> findByUserIdAndAccountId(UUID userId, UUID accountId, Pageable pageable);

    Page<CreditCardPaymentPlan> findByUserIdAndAccountIdAndStatus(
            UUID userId, UUID accountId, PaymentPlanStatus status, Pageable pageable);

    Page<CreditCardPaymentPlan> findByUserIdAndAccountIdAndPaymentType(
            UUID userId, UUID accountId, PaymentType paymentType, Pageable pageable);

    Page<CreditCardPaymentPlan> findByUserIdAndAccountIdAndStatusAndPaymentType(
            UUID userId, UUID accountId, PaymentPlanStatus status, PaymentType paymentType, Pageable pageable);

    Optional<CreditCardPaymentPlan> findByIdAndUserId(UUID id, UUID userId);

    Optional<CreditCardPaymentPlan> findByTransactionId(UUID transactionId);

    List<CreditCardPaymentPlan> findByUserIdAndStatus(UUID userId, PaymentPlanStatus status);

    @Query("SELECT p FROM CreditCardPaymentPlan p WHERE p.user.id = :userId AND p.status = 'ACTIVE' AND p.nextPaymentDate <= :date")
    List<CreditCardPaymentPlan> findActivePlansWithUpcomingPayments(
            @Param("userId") UUID userId, @Param("date") LocalDate date);

    @Query("SELECT COUNT(p) FROM CreditCardPaymentPlan p WHERE p.user.id = :userId AND p.status = 'ACTIVE'")
    long countActivePlans(@Param("userId") UUID userId);

    @Query("SELECT p FROM CreditCardPaymentPlan p WHERE p.status = 'ACTIVE' AND p.nextPaymentDate <= :date")
    List<CreditCardPaymentPlan> findAllActivePlansWithUpcomingPayments(@Param("date") LocalDate date);
}
