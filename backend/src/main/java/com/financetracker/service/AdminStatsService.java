package com.financetracker.service;

import com.financetracker.dto.admin.AdminStatsResponse;
import com.financetracker.entity.Role;
import com.financetracker.repository.AccountRepository;
import com.financetracker.repository.BudgetRepository;
import com.financetracker.repository.CategoryRepository;
import com.financetracker.repository.TransactionRepository;
import com.financetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class AdminStatsService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;

    public AdminStatsResponse getStats() {
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime sevenDaysAgo = now.minusDays(7);
        OffsetDateTime thirtyDaysAgo = now.minusDays(30);

        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByEnabled(true);
        long disabledUsers = userRepository.countByEnabled(false);
        long adminUsers = userRepository.countByRole(Role.ADMIN);

        long totalAccounts = accountRepository.count();
        long totalTransactions = transactionRepository.count();
        long totalBudgets = budgetRepository.count();
        long totalCategories = categoryRepository.count();

        long usersLast7Days = userRepository.countByCreatedAtAfter(sevenDaysAgo);
        long usersLast30Days = userRepository.countByCreatedAtAfter(thirtyDaysAgo);
        long transactionsLast7Days = transactionRepository.countByCreatedAtAfter(sevenDaysAgo);
        long transactionsLast30Days = transactionRepository.countByCreatedAtAfter(thirtyDaysAgo);

        return AdminStatsResponse.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .disabledUsers(disabledUsers)
                .adminUsers(adminUsers)
                .totalAccounts(totalAccounts)
                .totalTransactions(totalTransactions)
                .totalBudgets(totalBudgets)
                .totalCategories(totalCategories)
                .usersLast7Days(usersLast7Days)
                .usersLast30Days(usersLast30Days)
                .transactionsLast7Days(transactionsLast7Days)
                .transactionsLast30Days(transactionsLast30Days)
                .build();
    }
}
