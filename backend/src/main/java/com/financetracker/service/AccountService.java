package com.financetracker.service;

import com.financetracker.dto.account.AccountRequest;
import com.financetracker.dto.account.AccountResponse;
import com.financetracker.entity.Account;
import com.financetracker.entity.User;
import com.financetracker.exception.ApiException;
import com.financetracker.repository.AccountRepository;
import com.financetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    public List<AccountResponse> getAllAccounts(UUID userId) {
        return accountRepository.findByUserIdAndIsActiveTrue(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public AccountResponse getAccount(UUID userId, UUID accountId) {
        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> ApiException.notFound("Account"));
        return toResponse(account);
    }

    @Transactional
    public AccountResponse createAccount(UUID userId, AccountRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User"));

        Account account = Account.builder()
                .user(user)
                .name(request.getName())
                .type(request.getType())
                .currency(request.getCurrency() != null ? request.getCurrency() : user.getDefaultCurrency())
                .initialBalance(request.getInitialBalance())
                .currentBalance(request.getInitialBalance())
                .icon(request.getIcon())
                .color(request.getColor())
                .isActive(true)
                .creditLimit(request.getCreditLimit())
                .billingDay(request.getBillingDay())
                .paymentDueDay(request.getPaymentDueDay())
                .build();

        account = accountRepository.save(account);
        return toResponse(account);
    }

    @Transactional
    public AccountResponse updateAccount(UUID userId, UUID accountId, AccountRequest request) {
        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> ApiException.notFound("Account"));

        account.setName(request.getName());
        account.setType(request.getType());
        account.setIcon(request.getIcon());
        account.setColor(request.getColor());

        // Allow updating initialBalance - recalculate currentBalance
        if (request.getInitialBalance() != null &&
            !request.getInitialBalance().equals(account.getInitialBalance())) {
            java.math.BigDecimal difference = request.getInitialBalance().subtract(account.getInitialBalance());
            account.setInitialBalance(request.getInitialBalance());
            account.setCurrentBalance(account.getCurrentBalance().add(difference));
        }

        // Update credit card specific fields
        account.setCreditLimit(request.getCreditLimit());
        account.setBillingDay(request.getBillingDay());
        account.setPaymentDueDay(request.getPaymentDueDay());

        account = accountRepository.save(account);
        return toResponse(account);
    }

    @Transactional
    public void deleteAccount(UUID userId, UUID accountId) {
        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> ApiException.notFound("Account"));
        account.setIsActive(false);
        accountRepository.save(account);
    }

    private AccountResponse toResponse(Account account) {
        return AccountResponse.builder()
                .id(account.getId())
                .name(account.getName())
                .type(account.getType())
                .currency(account.getCurrency())
                .initialBalance(account.getInitialBalance())
                .currentBalance(account.getCurrentBalance())
                .icon(account.getIcon())
                .color(account.getColor())
                .isActive(account.getIsActive())
                .createdAt(account.getCreatedAt())
                .updatedAt(account.getUpdatedAt())
                .creditLimit(account.getCreditLimit())
                .billingDay(account.getBillingDay())
                .paymentDueDay(account.getPaymentDueDay())
                .build();
    }
}
