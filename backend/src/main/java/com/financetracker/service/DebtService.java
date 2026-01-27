package com.financetracker.service;

import com.financetracker.dto.debt.*;
import com.financetracker.entity.Account;
import com.financetracker.entity.Debt;
import com.financetracker.entity.DebtStatus;
import com.financetracker.entity.DebtType;
import com.financetracker.entity.User;
import com.financetracker.exception.ApiException;
import com.financetracker.repository.AccountRepository;
import com.financetracker.repository.DebtRepository;
import com.financetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DebtService {

    private final DebtRepository debtRepository;
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;

    @Transactional(readOnly = true)
    public Page<DebtResponse> getAll(UUID userId, DebtType type, DebtStatus status, Pageable pageable) {
        Page<Debt> debts;

        if (type != null && status != null) {
            debts = debtRepository.findByUserIdAndTypeAndStatus(userId, type, status, pageable);
        } else if (type != null) {
            debts = debtRepository.findByUserIdAndType(userId, type, pageable);
        } else if (status != null) {
            debts = debtRepository.findByUserIdAndStatus(userId, status, pageable);
        } else {
            debts = debtRepository.findByUserId(userId, pageable);
        }

        return debts.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public DebtResponse getById(UUID userId, UUID id) {
        Debt debt = findByIdAndUserId(id, userId);
        return toResponse(debt);
    }

    @Transactional
    public DebtResponse create(UUID userId, DebtRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        String currency = request.getCurrency();
        if (currency == null || currency.isBlank()) {
            currency = user.getDefaultCurrency();
        }
        if (currency == null || currency.isBlank()) {
            currency = "VND";
        }

        Debt debt = Debt.builder()
                .user(user)
                .type(request.getType())
                .personName(request.getPersonName())
                .amount(request.getAmount())
                .currency(currency)
                .description(request.getDescription())
                .startDate(request.getStartDate())
                .dueDate(request.getDueDate())
                .status(DebtStatus.ACTIVE)
                .paidAmount(BigDecimal.ZERO)
                .note(request.getNote())
                .build();

        debt = debtRepository.save(debt);
        log.info("Created debt {} for user {}", debt.getId(), userId);

        return toResponse(debt);
    }

    @Transactional
    public DebtResponse update(UUID userId, UUID id, DebtRequest request) {
        Debt debt = findByIdAndUserId(id, userId);

        debt.setType(request.getType());
        debt.setPersonName(request.getPersonName());
        debt.setAmount(request.getAmount());
        debt.setCurrency(request.getCurrency() != null ? request.getCurrency() : debt.getCurrency());
        debt.setDescription(request.getDescription());
        debt.setStartDate(request.getStartDate());
        debt.setDueDate(request.getDueDate());
        debt.setNote(request.getNote());

        // Update status based on paid amount
        updateStatus(debt);

        debt = debtRepository.save(debt);
        log.info("Updated debt {} for user {}", debt.getId(), userId);

        return toResponse(debt);
    }

    @Transactional
    public DebtResponse recordPayment(UUID userId, UUID id, DebtPaymentRequest request) {
        Debt debt = findByIdAndUserId(id, userId);

        if (debt.getStatus() == DebtStatus.PAID || debt.getStatus() == DebtStatus.CANCELLED) {
            throw new ApiException("Cannot record payment for " + debt.getStatus().name().toLowerCase() + " debt", HttpStatus.BAD_REQUEST);
        }

        BigDecimal newPaidAmount = debt.getPaidAmount().add(request.getAmount());
        BigDecimal remaining = debt.getAmount().subtract(newPaidAmount);

        if (remaining.compareTo(BigDecimal.ZERO) < 0) {
            throw new ApiException("Payment amount exceeds remaining debt", HttpStatus.BAD_REQUEST);
        }

        debt.setPaidAmount(newPaidAmount);

        // Build payment note with date and account info
        LocalDate paymentDate = request.getPaymentDate() != null ? request.getPaymentDate() : LocalDate.now();
        StringBuilder paymentNote = new StringBuilder();
        paymentNote.append("[").append(paymentDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).append("] ");
        paymentNote.append("Thanh toán: ").append(request.getAmount());

        if (request.getAccountId() != null) {
            accountRepository.findById(request.getAccountId()).ifPresent(account -> {
                paymentNote.append(" từ ").append(account.getName());
            });
        }

        if (request.getNote() != null && !request.getNote().isBlank()) {
            paymentNote.append(" - ").append(request.getNote());
        }

        String existingNote = debt.getNote() != null ? debt.getNote() + "\n" : "";
        debt.setNote(existingNote + paymentNote);

        updateStatus(debt);

        debt = debtRepository.save(debt);
        log.info("Recorded payment {} for debt {} of user {}", request.getAmount(), id, userId);

        return toResponse(debt);
    }

    @Transactional
    public DebtResponse markAsPaid(UUID userId, UUID id) {
        Debt debt = findByIdAndUserId(id, userId);

        debt.setPaidAmount(debt.getAmount());
        debt.setStatus(DebtStatus.PAID);

        debt = debtRepository.save(debt);
        log.info("Marked debt {} as paid for user {}", id, userId);

        return toResponse(debt);
    }

    @Transactional
    public DebtResponse cancel(UUID userId, UUID id) {
        Debt debt = findByIdAndUserId(id, userId);

        if (debt.getStatus() == DebtStatus.PAID) {
            throw new ApiException("Cannot cancel a paid debt", HttpStatus.BAD_REQUEST);
        }

        debt.setStatus(DebtStatus.CANCELLED);

        debt = debtRepository.save(debt);
        log.info("Cancelled debt {} for user {}", id, userId);

        return toResponse(debt);
    }

    @Transactional
    public void delete(UUID userId, UUID id) {
        Debt debt = findByIdAndUserId(id, userId);
        debtRepository.delete(debt);
        log.info("Deleted debt {} for user {}", id, userId);
    }

    @Transactional(readOnly = true)
    public DebtSummary getSummary(UUID userId) {
        BigDecimal totalLent = debtRepository.sumOutstandingByType(userId, DebtType.LEND);
        BigDecimal totalBorrowed = debtRepository.sumOutstandingByType(userId, DebtType.BORROW);
        long activeCount = debtRepository.countActiveDebts(userId);
        List<Debt> overdueDebts = debtRepository.findOverdueDebts(userId, LocalDate.now());

        totalLent = totalLent != null ? totalLent : BigDecimal.ZERO;
        totalBorrowed = totalBorrowed != null ? totalBorrowed : BigDecimal.ZERO;

        return DebtSummary.builder()
                .totalLent(totalLent)
                .totalBorrowed(totalBorrowed)
                .netBalance(totalLent.subtract(totalBorrowed))
                .activeDebtsCount(activeCount)
                .overdueCount(overdueDebts.size())
                .build();
    }

    @Transactional(readOnly = true)
    public List<DebtResponse> getOverdueDebts(UUID userId) {
        List<Debt> overdueDebts = debtRepository.findOverdueDebts(userId, LocalDate.now());
        return overdueDebts.stream().map(this::toResponse).toList();
    }

    private void updateStatus(Debt debt) {
        BigDecimal remaining = debt.getAmount().subtract(debt.getPaidAmount());

        if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
            debt.setStatus(DebtStatus.PAID);
        } else if (debt.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            debt.setStatus(DebtStatus.PARTIALLY_PAID);
        } else {
            debt.setStatus(DebtStatus.ACTIVE);
        }
    }

    private Debt findByIdAndUserId(UUID id, UUID userId) {
        return debtRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ApiException("Debt not found", HttpStatus.NOT_FOUND));
    }

    private DebtResponse toResponse(Debt debt) {
        BigDecimal remaining = debt.getAmount().subtract(debt.getPaidAmount());
        boolean overdue = debt.getDueDate() != null
                && debt.getDueDate().isBefore(LocalDate.now())
                && (debt.getStatus() == DebtStatus.ACTIVE || debt.getStatus() == DebtStatus.PARTIALLY_PAID);

        return DebtResponse.builder()
                .id(debt.getId())
                .type(debt.getType())
                .personName(debt.getPersonName())
                .amount(debt.getAmount())
                .currency(debt.getCurrency())
                .description(debt.getDescription())
                .startDate(debt.getStartDate())
                .dueDate(debt.getDueDate())
                .status(debt.getStatus())
                .paidAmount(debt.getPaidAmount())
                .remainingAmount(remaining)
                .note(debt.getNote())
                .overdue(overdue)
                .createdAt(debt.getCreatedAt())
                .updatedAt(debt.getUpdatedAt())
                .build();
    }
}
