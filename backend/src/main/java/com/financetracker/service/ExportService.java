package com.financetracker.service;

import com.financetracker.entity.*;
import com.financetracker.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExportService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final DebtRepository debtRepository;
    private final RecurringTransactionRepository recurringTransactionRepository;
    private final SavingsGoalRepository savingsGoalRepository;

    public byte[] exportTransactionsCsv(UUID userId, LocalDate startDate, LocalDate endDate,
                                         UUID accountId, String type) {
        List<Transaction> transactions;

        if (startDate != null && endDate != null) {
            transactions = transactionRepository.findByUserIdAndDateRange(userId, startDate, endDate);
        } else {
            transactions = transactionRepository.findByUserId(userId);
        }

        // Filter in memory for accountId and type if provided
        if (accountId != null) {
            transactions = transactions.stream()
                    .filter(t -> t.getAccount() != null && accountId.equals(t.getAccount().getId()))
                    .collect(Collectors.toList());
        }
        if (type != null && !type.isBlank()) {
            transactions = transactions.stream()
                    .filter(t -> t.getType() != null && type.equalsIgnoreCase(t.getType().name()))
                    .collect(Collectors.toList());
        }

        transactions.sort(Comparator.comparing(Transaction::getTransactionDate).reversed());

        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            // BOM for Excel UTF-8 compatibility
            baos.write(new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF});
            OutputStreamWriter writer = new OutputStreamWriter(baos, StandardCharsets.UTF_8);

            // Header
            writer.write("Date,Type,Amount,Currency,Category,Account,To Account,Description,Exchange Rate\n");

            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            for (Transaction t : transactions) {
                writer.write(escapeCsv(t.getTransactionDate() != null ? t.getTransactionDate().format(fmt) : ""));
                writer.write(",");
                writer.write(escapeCsv(t.getType() != null ? t.getType().name() : ""));
                writer.write(",");
                writer.write(t.getAmount() != null ? t.getAmount().toPlainString() : "0");
                writer.write(",");
                writer.write(escapeCsv(t.getCurrency() != null ? t.getCurrency() : ""));
                writer.write(",");
                writer.write(escapeCsv(t.getCategory() != null ? t.getCategory().getName() : ""));
                writer.write(",");
                writer.write(escapeCsv(t.getAccount() != null ? t.getAccount().getName() : ""));
                writer.write(",");
                writer.write(escapeCsv(t.getToAccount() != null ? t.getToAccount().getName() : ""));
                writer.write(",");
                writer.write(escapeCsv(t.getDescription() != null ? t.getDescription() : ""));
                writer.write(",");
                writer.write(t.getExchangeRate() != null ? t.getExchangeRate().toPlainString() : "");
                writer.write("\n");
            }

            writer.flush();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate CSV", e);
        }
    }

    public byte[] exportFullBackup(UUID userId) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            mapper.disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

            Map<String, Object> backup = new LinkedHashMap<>();
            backup.put("exportedAt", OffsetDateTime.now().toString());
            backup.put("version", "1.0");

            // Accounts
            List<Account> accounts = accountRepository.findByUserId(userId);
            backup.put("accounts", accounts.stream().map(this::mapAccount).collect(Collectors.toList()));

            // Transactions
            List<Transaction> transactions = transactionRepository.findByUserId(userId);
            transactions.sort(Comparator.comparing(Transaction::getTransactionDate).reversed());
            backup.put("transactions", transactions.stream().map(this::mapTransaction).collect(Collectors.toList()));

            // Budgets
            List<Budget> budgets = budgetRepository.findByUserId(userId);
            backup.put("budgets", budgets.stream().map(this::mapBudget).collect(Collectors.toList()));

            // Categories (custom only)
            List<Category> categories = categoryRepository.findByUserId(userId);
            backup.put("categories", categories.stream().map(this::mapCategory).collect(Collectors.toList()));

            // Debts
            List<Debt> debts = debtRepository.findByUserIdAndStatusIn(userId, Arrays.asList(DebtStatus.values()));
            backup.put("debts", debts.stream().map(this::mapDebt).collect(Collectors.toList()));

            // Recurring transactions
            List<RecurringTransaction> recurring = recurringTransactionRepository.findByUserId(userId);
            backup.put("recurringTransactions", recurring.stream().map(this::mapRecurring).collect(Collectors.toList()));

            // Savings goals
            List<SavingsGoal> savingsGoals = savingsGoalRepository.findByUserId(userId);
            backup.put("savingsGoals", savingsGoals.stream().map(this::mapSavingsGoal).collect(Collectors.toList()));

            return mapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(backup);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate backup", e);
        }
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private Map<String, Object> mapAccount(Account a) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", a.getId());
        m.put("name", a.getName());
        m.put("type", a.getType() != null ? a.getType().name() : null);
        m.put("currency", a.getCurrency());
        m.put("initialBalance", a.getInitialBalance());
        m.put("currentBalance", a.getCurrentBalance());
        m.put("icon", a.getIcon());
        m.put("color", a.getColor());
        m.put("creditLimit", a.getCreditLimit());
        return m;
    }

    private Map<String, Object> mapTransaction(Transaction t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", t.getId());
        m.put("date", t.getTransactionDate() != null ? t.getTransactionDate().toString() : null);
        m.put("type", t.getType() != null ? t.getType().name() : null);
        m.put("amount", t.getAmount());
        m.put("currency", t.getCurrency());
        m.put("description", t.getDescription());
        m.put("accountId", t.getAccount() != null ? t.getAccount().getId() : null);
        m.put("accountName", t.getAccount() != null ? t.getAccount().getName() : null);
        m.put("categoryId", t.getCategory() != null ? t.getCategory().getId() : null);
        m.put("categoryName", t.getCategory() != null ? t.getCategory().getName() : null);
        m.put("toAccountId", t.getToAccount() != null ? t.getToAccount().getId() : null);
        m.put("toAccountName", t.getToAccount() != null ? t.getToAccount().getName() : null);
        m.put("exchangeRate", t.getExchangeRate());
        m.put("createdAt", t.getCreatedAt() != null ? t.getCreatedAt().toString() : null);
        return m;
    }

    private Map<String, Object> mapBudget(Budget b) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", b.getId());
        m.put("name", b.getName());
        m.put("amount", b.getAmount());
        m.put("currency", b.getCurrency());
        m.put("period", b.getPeriod() != null ? b.getPeriod().name() : null);
        m.put("startDate", b.getStartDate() != null ? b.getStartDate().toString() : null);
        m.put("endDate", b.getEndDate() != null ? b.getEndDate().toString() : null);
        m.put("alertThreshold", b.getAlertThreshold());
        m.put("isActive", b.getIsActive());
        return m;
    }

    private Map<String, Object> mapCategory(Category c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.getId());
        m.put("name", c.getName());
        m.put("type", c.getType() != null ? c.getType().name() : null);
        m.put("icon", c.getIcon());
        m.put("color", c.getColor());
        return m;
    }

    private Map<String, Object> mapDebt(Debt d) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", d.getId());
        m.put("personName", d.getPersonName());
        m.put("amount", d.getAmount());
        m.put("currency", d.getCurrency());
        m.put("type", d.getType() != null ? d.getType().name() : null);
        m.put("status", d.getStatus() != null ? d.getStatus().name() : null);
        m.put("description", d.getDescription());
        m.put("startDate", d.getStartDate() != null ? d.getStartDate().toString() : null);
        m.put("dueDate", d.getDueDate() != null ? d.getDueDate().toString() : null);
        m.put("paidAmount", d.getPaidAmount());
        return m;
    }

    private Map<String, Object> mapRecurring(RecurringTransaction r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", r.getId());
        m.put("description", r.getDescription());
        m.put("amount", r.getAmount());
        m.put("currency", r.getCurrency());
        m.put("type", r.getType() != null ? r.getType().name() : null);
        m.put("frequency", r.getFrequency() != null ? r.getFrequency().name() : null);
        m.put("interval", r.getIntervalValue());
        m.put("startDate", r.getStartDate() != null ? r.getStartDate().toString() : null);
        m.put("endDate", r.getEndDate() != null ? r.getEndDate().toString() : null);
        m.put("status", r.getStatus() != null ? r.getStatus().name() : null);
        m.put("nextExecutionDate", r.getNextExecutionDate() != null ? r.getNextExecutionDate().toString() : null);
        return m;
    }

    private Map<String, Object> mapSavingsGoal(SavingsGoal s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", s.getId());
        m.put("name", s.getName());
        m.put("targetAmount", s.getTargetAmount());
        m.put("currentAmount", s.getCurrentAmount());
        m.put("currency", s.getCurrency());
        m.put("status", s.getStatus() != null ? s.getStatus().name() : null);
        m.put("targetDate", s.getTargetDate() != null ? s.getTargetDate().toString() : null);
        m.put("description", s.getDescription());
        return m;
    }
}
