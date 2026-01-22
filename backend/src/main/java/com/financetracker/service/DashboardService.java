package com.financetracker.service;

import com.financetracker.dto.dashboard.CashflowReport;
import com.financetracker.dto.dashboard.CategoryReport;
import com.financetracker.dto.dashboard.DashboardSummary;
import com.financetracker.entity.Account;
import com.financetracker.entity.Transaction;
import com.financetracker.entity.TransactionType;
import com.financetracker.repository.AccountRepository;
import com.financetracker.repository.CategoryRepository;
import com.financetracker.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;

    public DashboardSummary getSummary(UUID userId, String primaryCurrency) {
        List<Account> accounts = accountRepository.findByUserIdAndIsActiveTrue(userId);

        Map<String, BigDecimal> balanceByCurrency = new HashMap<>();
        for (Account account : accounts) {
            balanceByCurrency.merge(account.getCurrency(), account.getCurrentBalance(), BigDecimal::add);
        }

        BigDecimal totalBalance = balanceByCurrency.getOrDefault(primaryCurrency, BigDecimal.ZERO);

        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
        LocalDate endOfMonth = LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth());

        List<Object[]> sumByType = transactionRepository.sumByTypeAndDateRange(userId, startOfMonth, endOfMonth);

        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;

        for (Object[] row : sumByType) {
            TransactionType type = (TransactionType) row[0];
            BigDecimal sum = (BigDecimal) row[1];
            if (type == TransactionType.INCOME) {
                totalIncome = sum;
            } else if (type == TransactionType.EXPENSE) {
                totalExpense = sum;
            }
        }

        List<DashboardSummary.AccountSummary> accountSummaries = accounts.stream()
                .map(a -> DashboardSummary.AccountSummary.builder()
                        .name(a.getName())
                        .type(a.getType().name())
                        .balance(a.getCurrentBalance())
                        .currency(a.getCurrency())
                        .icon(a.getIcon())
                        .color(a.getColor())
                        .build())
                .collect(Collectors.toList());

        return DashboardSummary.builder()
                .totalBalance(totalBalance)
                .primaryCurrency(primaryCurrency)
                .balanceByCurrency(balanceByCurrency)
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .netCashflow(totalIncome.subtract(totalExpense))
                .accounts(accountSummaries)
                .build();
    }

    public CashflowReport getCashflowReport(UUID userId, LocalDate startDate, LocalDate endDate) {
        List<Transaction> transactions = transactionRepository.findByUserIdAndDateRange(userId, startDate, endDate);

        Map<LocalDate, BigDecimal> incomeByDate = new HashMap<>();
        Map<LocalDate, BigDecimal> expenseByDate = new HashMap<>();

        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;

        for (Transaction t : transactions) {
            LocalDate date = t.getTransactionDate();
            if (t.getType() == TransactionType.INCOME) {
                incomeByDate.merge(date, t.getAmount(), BigDecimal::add);
                totalIncome = totalIncome.add(t.getAmount());
            } else if (t.getType() == TransactionType.EXPENSE) {
                expenseByDate.merge(date, t.getAmount(), BigDecimal::add);
                totalExpense = totalExpense.add(t.getAmount());
            }
        }

        List<CashflowReport.DailyCashflow> dailyData = new ArrayList<>();
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            BigDecimal income = incomeByDate.getOrDefault(current, BigDecimal.ZERO);
            BigDecimal expense = expenseByDate.getOrDefault(current, BigDecimal.ZERO);
            dailyData.add(CashflowReport.DailyCashflow.builder()
                    .date(current)
                    .income(income)
                    .expense(expense)
                    .net(income.subtract(expense))
                    .build());
            current = current.plusDays(1);
        }

        return CashflowReport.builder()
                .startDate(startDate)
                .endDate(endDate)
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .netCashflow(totalIncome.subtract(totalExpense))
                .dailyData(dailyData)
                .build();
    }

    public CategoryReport getCategoryReport(UUID userId, TransactionType type, LocalDate startDate, LocalDate endDate) {
        List<Object[]> results = transactionRepository.sumByCategoryAndDateRange(userId, type, startDate, endDate);

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<CategoryReport.CategoryBreakdown> breakdowns = new ArrayList<>();

        for (Object[] row : results) {
            UUID categoryId = (UUID) row[0];
            String categoryName = (String) row[1];
            BigDecimal amount = (BigDecimal) row[2];
            totalAmount = totalAmount.add(amount);

            breakdowns.add(CategoryReport.CategoryBreakdown.builder()
                    .categoryId(categoryId)
                    .categoryName(categoryName != null ? categoryName : "Uncategorized")
                    .amount(amount)
                    .build());
        }

        final BigDecimal total = totalAmount;
        breakdowns.forEach(b -> {
            double percentage = total.compareTo(BigDecimal.ZERO) > 0
                    ? b.getAmount().divide(total, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                    : 0;
            b.setPercentage(percentage);
        });

        breakdowns.sort((a, b) -> b.getAmount().compareTo(a.getAmount()));

        return CategoryReport.builder()
                .type(type)
                .totalAmount(totalAmount)
                .categories(breakdowns)
                .build();
    }
}
