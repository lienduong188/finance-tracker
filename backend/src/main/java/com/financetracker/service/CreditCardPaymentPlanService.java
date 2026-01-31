package com.financetracker.service;

import com.financetracker.dto.creditcard.*;
import com.financetracker.entity.*;
import com.financetracker.exception.ApiException;
import com.financetracker.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CreditCardPaymentPlanService {

    private final CreditCardPaymentPlanRepository planRepository;
    private final CreditCardPaymentRepository paymentRepository;
    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<CreditCardPaymentPlanResponse> getAll(UUID userId, UUID accountId, PaymentPlanStatus status, PaymentType paymentType, Pageable pageable) {
        Page<CreditCardPaymentPlan> plans;

        if (accountId != null) {
            // Filter by account
            if (status != null && paymentType != null) {
                plans = planRepository.findByUserIdAndAccountIdAndStatusAndPaymentType(userId, accountId, status, paymentType, pageable);
            } else if (status != null) {
                plans = planRepository.findByUserIdAndAccountIdAndStatus(userId, accountId, status, pageable);
            } else if (paymentType != null) {
                plans = planRepository.findByUserIdAndAccountIdAndPaymentType(userId, accountId, paymentType, pageable);
            } else {
                plans = planRepository.findByUserIdAndAccountId(userId, accountId, pageable);
            }
        } else {
            // No account filter
            if (status != null && paymentType != null) {
                plans = planRepository.findByUserIdAndStatusAndPaymentType(userId, status, paymentType, pageable);
            } else if (status != null) {
                plans = planRepository.findByUserIdAndStatus(userId, status, pageable);
            } else if (paymentType != null) {
                plans = planRepository.findByUserIdAndPaymentType(userId, paymentType, pageable);
            } else {
                plans = planRepository.findByUserId(userId, pageable);
            }
        }

        return plans.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public CreditCardPaymentPlanResponse getById(UUID userId, UUID id) {
        CreditCardPaymentPlan plan = findByIdAndUserId(id, userId);
        return toResponseWithPayments(plan);
    }

    @Transactional
    public BulkCreditCardPaymentPlanResponse createBulk(UUID userId, BulkCreditCardPaymentPlanRequest request) {
        List<CreditCardPaymentPlanResponse> createdPlans = new ArrayList<>();
        List<BulkCreditCardPaymentPlanResponse.BulkCreateError> errors = new ArrayList<>();

        for (UUID transactionId : request.getTransactionIds()) {
            try {
                CreditCardPaymentPlanRequest singleRequest = CreditCardPaymentPlanRequest.builder()
                        .transactionId(transactionId)
                        .paymentType(request.getPaymentType())
                        .totalInstallments(request.getTotalInstallments())
                        .installmentFeeRate(request.getInstallmentFeeRate())
                        .monthlyPayment(request.getMonthlyPayment())
                        .interestRate(request.getInterestRate())
                        .startDate(request.getStartDate())
                        .build();

                CreditCardPaymentPlanResponse response = create(userId, singleRequest);
                createdPlans.add(response);
            } catch (Exception e) {
                errors.add(BulkCreditCardPaymentPlanResponse.BulkCreateError.builder()
                        .transactionId(transactionId.toString())
                        .error(e.getMessage())
                        .build());
                log.warn("Failed to create plan for transaction {}: {}", transactionId, e.getMessage());
            }
        }

        log.info("Bulk created {} plans for user {}, {} failed",
                createdPlans.size(), userId, errors.size());

        return BulkCreditCardPaymentPlanResponse.builder()
                .totalRequested(request.getTransactionIds().size())
                .successCount(createdPlans.size())
                .failedCount(errors.size())
                .createdPlans(createdPlans)
                .errors(errors)
                .build();
    }

    @Transactional
    public CreditCardPaymentPlanResponse create(UUID userId, CreditCardPaymentPlanRequest request) {
        // Validate transaction
        Transaction transaction = transactionRepository.findById(request.getTransactionId())
                .orElseThrow(() -> new ApiException("Transaction not found", HttpStatus.NOT_FOUND));

        if (!transaction.getUser().getId().equals(userId)) {
            throw new ApiException("Transaction not found", HttpStatus.NOT_FOUND);
        }

        // Check if transaction already has a payment plan
        if (transaction.getPaymentPlan() != null) {
            throw new ApiException("Transaction already has a payment plan", HttpStatus.BAD_REQUEST);
        }

        // Validate account is credit card
        Account account = transaction.getAccount();
        if (account.getType() != AccountType.CREDIT_CARD) {
            throw new ApiException("Payment plans are only available for credit card transactions", HttpStatus.BAD_REQUEST);
        }

        // Validate transaction is expense
        if (transaction.getType() != TransactionType.EXPENSE) {
            throw new ApiException("Payment plans are only available for expense transactions", HttpStatus.BAD_REQUEST);
        }

        User user = transaction.getUser();
        LocalDate startDate = request.getStartDate() != null ? request.getStartDate() : transaction.getTransactionDate();

        CreditCardPaymentPlan plan;
        if (request.getPaymentType() == PaymentType.INSTALLMENT) {
            plan = createInstallmentPlan(user, transaction, account, request, startDate);
        } else if (request.getPaymentType() == PaymentType.REVOLVING) {
            plan = createRevolvingPlan(user, transaction, account, request, startDate);
        } else {
            throw new ApiException("Invalid payment type", HttpStatus.BAD_REQUEST);
        }

        plan = planRepository.save(plan);

        // Update transaction
        transaction.setPaymentType(request.getPaymentType());
        transaction.setPaymentPlan(plan);
        transactionRepository.save(transaction);

        log.info("Created {} plan {} for transaction {} of user {}",
                request.getPaymentType(), plan.getId(), transaction.getId(), userId);

        return toResponseWithPayments(plan);
    }

    private CreditCardPaymentPlan createInstallmentPlan(User user, Transaction transaction, Account account,
                                                         CreditCardPaymentPlanRequest request, LocalDate startDate) {
        if (request.getTotalInstallments() == null || request.getTotalInstallments() < 2) {
            throw new ApiException("Total installments must be at least 2", HttpStatus.BAD_REQUEST);
        }

        BigDecimal originalAmount = transaction.getAmount();
        BigDecimal feeRate = request.getInstallmentFeeRate() != null ? request.getInstallmentFeeRate() : BigDecimal.ZERO;

        // Calculate fee per installment and total
        // feePerInstallment = originalAmount * feeRate
        // totalFee = feePerInstallment * totalInstallments
        BigDecimal feePerInstallment = originalAmount.multiply(feeRate).setScale(4, RoundingMode.HALF_UP);
        BigDecimal totalFee = feePerInstallment.multiply(BigDecimal.valueOf(request.getTotalInstallments()));
        BigDecimal totalAmountWithFee = originalAmount.add(totalFee);

        // Calculate amount per installment
        BigDecimal installmentAmount = totalAmountWithFee.divide(
                BigDecimal.valueOf(request.getTotalInstallments()), 4, RoundingMode.HALF_UP);

        // Get billing day from account (default to 1 if not set)
        int billingDay = account.getBillingDay() != null ? account.getBillingDay() : 1;
        LocalDate firstPaymentDate = calculateFirstPaymentDate(startDate, billingDay);

        CreditCardPaymentPlan plan = CreditCardPaymentPlan.builder()
                .user(user)
                .transaction(transaction)
                .account(account)
                .paymentType(PaymentType.INSTALLMENT)
                .originalAmount(originalAmount)
                .totalAmountWithFee(totalAmountWithFee)
                .remainingAmount(totalAmountWithFee)
                .currency(transaction.getCurrency())
                .startDate(startDate)
                .nextPaymentDate(firstPaymentDate)
                .totalInstallments(request.getTotalInstallments())
                .completedInstallments(0)
                .installmentAmount(installmentAmount)
                .installmentFeeRate(feeRate)
                .status(PaymentPlanStatus.ACTIVE)
                .payments(new ArrayList<>())
                .build();

        // Generate payment schedule
        BigDecimal principalPerInstallment = originalAmount.divide(
                BigDecimal.valueOf(request.getTotalInstallments()), 4, RoundingMode.HALF_UP);
        BigDecimal remaining = totalAmountWithFee;

        for (int i = 1; i <= request.getTotalInstallments(); i++) {
            LocalDate dueDate = firstPaymentDate.plusMonths(i - 1);
            remaining = remaining.subtract(installmentAmount);

            // Adjust last payment for rounding
            BigDecimal actualInstallmentAmount = installmentAmount;
            if (i == request.getTotalInstallments() && remaining.compareTo(BigDecimal.ZERO) != 0) {
                actualInstallmentAmount = installmentAmount.add(remaining);
                remaining = BigDecimal.ZERO;
            }

            CreditCardPayment payment = CreditCardPayment.builder()
                    .plan(plan)
                    .paymentNumber(i)
                    .principalAmount(principalPerInstallment)
                    .feeAmount(feePerInstallment)
                    .interestAmount(BigDecimal.ZERO)
                    .totalAmount(actualInstallmentAmount)
                    .remainingAfter(remaining.max(BigDecimal.ZERO))
                    .dueDate(dueDate)
                    .status(PaymentStatus.PENDING)
                    .build();

            plan.getPayments().add(payment);
        }

        return plan;
    }

    private CreditCardPaymentPlan createRevolvingPlan(User user, Transaction transaction, Account account,
                                                       CreditCardPaymentPlanRequest request, LocalDate startDate) {
        if (request.getMonthlyPayment() == null || request.getMonthlyPayment().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException("Monthly payment is required for revolving plan", HttpStatus.BAD_REQUEST);
        }

        if (request.getInterestRate() == null || request.getInterestRate().compareTo(BigDecimal.ZERO) < 0) {
            throw new ApiException("Interest rate is required for revolving plan", HttpStatus.BAD_REQUEST);
        }

        BigDecimal originalAmount = transaction.getAmount();
        BigDecimal monthlyPayment = request.getMonthlyPayment();
        BigDecimal annualRate = request.getInterestRate();
        BigDecimal monthlyRate = annualRate.divide(BigDecimal.valueOf(12), 8, RoundingMode.HALF_UP);

        if (monthlyPayment.compareTo(originalAmount.multiply(monthlyRate)) <= 0) {
            throw new ApiException("Monthly payment is too low to cover interest", HttpStatus.BAD_REQUEST);
        }

        // Get billing day from account (default to 1 if not set)
        int billingDay = account.getBillingDay() != null ? account.getBillingDay() : 1;
        LocalDate firstPaymentDate = calculateFirstPaymentDate(startDate, billingDay);

        CreditCardPaymentPlan plan = CreditCardPaymentPlan.builder()
                .user(user)
                .transaction(transaction)
                .account(account)
                .paymentType(PaymentType.REVOLVING)
                .originalAmount(originalAmount)
                .totalAmountWithFee(originalAmount) // Will be updated as interest accrues
                .remainingAmount(originalAmount)
                .currency(transaction.getCurrency())
                .startDate(startDate)
                .nextPaymentDate(firstPaymentDate)
                .monthlyPayment(monthlyPayment)
                .interestRate(annualRate)
                .status(PaymentPlanStatus.ACTIVE)
                .payments(new ArrayList<>())
                .build();

        // Generate estimated payment schedule
        BigDecimal remaining = originalAmount;
        BigDecimal totalWithInterest = BigDecimal.ZERO;
        int paymentNumber = 0;
        int maxPayments = 120; // Cap at 10 years to prevent infinite loops

        while (remaining.compareTo(BigDecimal.ZERO) > 0 && paymentNumber < maxPayments) {
            paymentNumber++;
            LocalDate dueDate = firstPaymentDate.plusMonths(paymentNumber - 1);

            // Calculate interest for this month
            BigDecimal interest = remaining.multiply(monthlyRate).setScale(4, RoundingMode.HALF_UP);

            // Determine actual payment
            BigDecimal actualPayment;
            BigDecimal principal;

            if (remaining.add(interest).compareTo(monthlyPayment) <= 0) {
                // Final payment
                actualPayment = remaining.add(interest);
                principal = remaining;
                remaining = BigDecimal.ZERO;
            } else {
                actualPayment = monthlyPayment;
                principal = monthlyPayment.subtract(interest);
                remaining = remaining.subtract(principal);
            }

            totalWithInterest = totalWithInterest.add(actualPayment);

            CreditCardPayment payment = CreditCardPayment.builder()
                    .plan(plan)
                    .paymentNumber(paymentNumber)
                    .principalAmount(principal)
                    .feeAmount(BigDecimal.ZERO)
                    .interestAmount(interest)
                    .totalAmount(actualPayment)
                    .remainingAfter(remaining.max(BigDecimal.ZERO))
                    .dueDate(dueDate)
                    .status(PaymentStatus.PENDING)
                    .build();

            plan.getPayments().add(payment);
        }

        plan.setTotalAmountWithFee(totalWithInterest);
        plan.setTotalInstallments(paymentNumber);
        plan.setCompletedInstallments(0);

        return plan;
    }

    private LocalDate calculateFirstPaymentDate(LocalDate startDate, int billingDay) {
        LocalDate firstPayment = startDate.withDayOfMonth(Math.min(billingDay, startDate.lengthOfMonth()));
        if (!firstPayment.isAfter(startDate)) {
            firstPayment = firstPayment.plusMonths(1);
            firstPayment = firstPayment.withDayOfMonth(Math.min(billingDay, firstPayment.lengthOfMonth()));
        }
        return firstPayment;
    }

    @Transactional
    public CreditCardPaymentResponse markPaymentAsPaid(UUID userId, UUID planId, UUID paymentId) {
        CreditCardPaymentPlan plan = findByIdAndUserId(planId, userId);

        CreditCardPayment payment = paymentRepository.findByIdAndPlanId(paymentId, planId)
                .orElseThrow(() -> new ApiException("Payment not found", HttpStatus.NOT_FOUND));

        if (payment.getStatus() == PaymentStatus.PAID) {
            throw new ApiException("Payment is already paid", HttpStatus.BAD_REQUEST);
        }

        // Mark as paid
        payment.setStatus(PaymentStatus.PAID);
        payment.setPaymentDate(LocalDate.now());
        paymentRepository.save(payment);

        // Update plan
        plan.setCompletedInstallments(plan.getCompletedInstallments() + 1);
        plan.setRemainingAmount(payment.getRemainingAfter());

        // Find next pending payment
        CreditCardPayment nextPayment = paymentRepository
                .findFirstByPlanIdAndStatusOrderByPaymentNumber(planId, PaymentStatus.PENDING)
                .orElse(null);

        if (nextPayment != null) {
            plan.setNextPaymentDate(nextPayment.getDueDate());
        } else {
            // All payments done
            plan.setStatus(PaymentPlanStatus.COMPLETED);
            plan.setNextPaymentDate(null);

            // Update transaction payment type back to ONE_TIME if cancelled
            Transaction transaction = plan.getTransaction();
            transaction.setPaymentType(PaymentType.ONE_TIME);
            transactionRepository.save(transaction);
        }

        planRepository.save(plan);

        log.info("Marked payment {} of plan {} as paid for user {}", paymentId, planId, userId);

        return toPaymentResponse(payment);
    }

    @Transactional
    public void cancel(UUID userId, UUID id) {
        CreditCardPaymentPlan plan = findByIdAndUserId(id, userId);

        if (plan.getStatus() == PaymentPlanStatus.COMPLETED) {
            throw new ApiException("Cannot cancel a completed plan", HttpStatus.BAD_REQUEST);
        }

        plan.setStatus(PaymentPlanStatus.CANCELLED);
        planRepository.save(plan);

        // Update transaction
        Transaction transaction = plan.getTransaction();
        transaction.setPaymentType(PaymentType.ONE_TIME);
        transaction.setPaymentPlan(null);
        transactionRepository.save(transaction);

        log.info("Cancelled plan {} for user {}", id, userId);
    }

    @Transactional(readOnly = true)
    public List<UpcomingPaymentResponse> getUpcomingPayments(UUID userId, int days) {
        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusDays(days);

        List<CreditCardPayment> payments = paymentRepository.findUpcomingPayments(userId, startDate, endDate);

        return payments.stream()
                .map(this::toUpcomingPaymentResponse)
                .collect(Collectors.toList());
    }

    private CreditCardPaymentPlan findByIdAndUserId(UUID id, UUID userId) {
        return planRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ApiException("Payment plan not found", HttpStatus.NOT_FOUND));
    }

    private CreditCardPaymentPlanResponse toResponse(CreditCardPaymentPlan plan) {
        return CreditCardPaymentPlanResponse.builder()
                .id(plan.getId())
                .transactionId(plan.getTransaction().getId())
                .transactionDescription(plan.getTransaction().getDescription())
                .transactionDate(plan.getTransaction().getTransactionDate())
                .accountId(plan.getAccount().getId())
                .accountName(plan.getAccount().getName())
                .paymentType(plan.getPaymentType())
                .originalAmount(plan.getOriginalAmount())
                .totalAmountWithFee(plan.getTotalAmountWithFee())
                .remainingAmount(plan.getRemainingAmount())
                .currency(plan.getCurrency())
                .startDate(plan.getStartDate())
                .nextPaymentDate(plan.getNextPaymentDate())
                .totalInstallments(plan.getTotalInstallments())
                .completedInstallments(plan.getCompletedInstallments())
                .installmentAmount(plan.getInstallmentAmount())
                .installmentFeeRate(plan.getInstallmentFeeRate())
                .monthlyPayment(plan.getMonthlyPayment())
                .interestRate(plan.getInterestRate())
                .status(plan.getStatus())
                .createdAt(plan.getCreatedAt())
                .build();
    }

    private CreditCardPaymentPlanResponse toResponseWithPayments(CreditCardPaymentPlan plan) {
        CreditCardPaymentPlanResponse response = toResponse(plan);

        List<CreditCardPaymentResponse> payments = paymentRepository.findByPlanIdOrderByPaymentNumber(plan.getId())
                .stream()
                .map(this::toPaymentResponse)
                .collect(Collectors.toList());

        response.setPayments(payments);
        return response;
    }

    private CreditCardPaymentResponse toPaymentResponse(CreditCardPayment payment) {
        return CreditCardPaymentResponse.builder()
                .id(payment.getId())
                .paymentNumber(payment.getPaymentNumber())
                .principalAmount(payment.getPrincipalAmount())
                .feeAmount(payment.getFeeAmount())
                .interestAmount(payment.getInterestAmount())
                .totalAmount(payment.getTotalAmount())
                .remainingAfter(payment.getRemainingAfter())
                .dueDate(payment.getDueDate())
                .paymentDate(payment.getPaymentDate())
                .status(payment.getStatus())
                .build();
    }

    private UpcomingPaymentResponse toUpcomingPaymentResponse(CreditCardPayment payment) {
        CreditCardPaymentPlan plan = payment.getPlan();
        return UpcomingPaymentResponse.builder()
                .paymentId(payment.getId())
                .planId(plan.getId())
                .paymentType(plan.getPaymentType())
                .accountName(plan.getAccount().getName())
                .transactionDescription(plan.getTransaction().getDescription())
                .paymentNumber(payment.getPaymentNumber())
                .totalInstallments(plan.getTotalInstallments())
                .totalAmount(payment.getTotalAmount())
                .currency(plan.getCurrency())
                .dueDate(payment.getDueDate())
                .status(payment.getStatus())
                .build();
    }
}
