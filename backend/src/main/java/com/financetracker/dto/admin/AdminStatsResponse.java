package com.financetracker.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AdminStatsResponse {

    private long totalUsers;
    private long activeUsers;
    private long disabledUsers;
    private long adminUsers;

    private long totalAccounts;
    private long totalTransactions;
    private long totalBudgets;
    private long totalCategories;

    private long usersLast7Days;
    private long usersLast30Days;
    private long transactionsLast7Days;
    private long transactionsLast30Days;
}
