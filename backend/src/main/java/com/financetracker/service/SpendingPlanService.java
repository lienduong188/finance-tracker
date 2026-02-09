package com.financetracker.service;

import com.financetracker.dto.spendingplan.*;
import com.financetracker.entity.*;
import com.financetracker.exception.ApiException;
import com.financetracker.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SpendingPlanService {

    private final SpendingPlanRepository spendingPlanRepository;
    private final SpendingPlanItemRepository itemRepository;
    private final SpendingPlanExpenseRepository expenseRepository;
    private final FamilyRepository familyRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final ExchangeRateService exchangeRateService;

    // === PLAN CRUD ===

    @Transactional
    public SpendingPlanResponse createPlan(UUID userId, SpendingPlanRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));

        SpendingPlan plan = SpendingPlan.builder()
                .name(request.getName())
                .description(request.getDescription())
                .currency(request.getCurrency() != null ? request.getCurrency() : user.getDefaultCurrency())
                .icon(request.getIcon())
                .color(request.getColor())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(SpendingPlanStatus.PLANNING)
                .build();

        if (request.getFamilyId() != null) {
            Family family = familyRepository.findById(request.getFamilyId())
                    .orElseThrow(() -> new ApiException("Không tìm thấy nhóm", HttpStatus.NOT_FOUND));
            if (!familyMemberRepository.existsByFamilyIdAndUserId(family.getId(), userId)) {
                throw new ApiException("Bạn không phải thành viên của nhóm", HttpStatus.FORBIDDEN);
            }
            plan.setFamily(family);
            plan.setUser(null);
        } else {
            plan.setUser(user);
            plan.setFamily(null);
        }

        plan = spendingPlanRepository.save(plan);
        return toSpendingPlanResponse(plan);
    }

    public List<SpendingPlanResponse> getMyPlans(UUID userId) {
        List<UUID> familyIds = familyMemberRepository.findByUserId(userId).stream()
                .map(m -> m.getFamily().getId())
                .collect(Collectors.toList());

        List<SpendingPlan> plans;
        if (familyIds.isEmpty()) {
            plans = spendingPlanRepository.findByUserIdOrderByCreatedAtDesc(userId);
        } else {
            plans = spendingPlanRepository.findAccessiblePlans(userId, familyIds);
        }

        return plans.stream()
                .map(this::toSpendingPlanResponse)
                .collect(Collectors.toList());
    }

    public SpendingPlanDetailResponse getPlan(UUID userId, UUID planId) {
        SpendingPlan plan = spendingPlanRepository.findById(planId)
                .orElseThrow(() -> new ApiException("Không tìm thấy kế hoạch", HttpStatus.NOT_FOUND));
        validatePlanAccess(plan, userId);
        return toSpendingPlanDetailResponse(plan);
    }

    @Transactional
    public SpendingPlanResponse updatePlan(UUID userId, UUID planId, SpendingPlanRequest request) {
        SpendingPlan plan = spendingPlanRepository.findById(planId)
                .orElseThrow(() -> new ApiException("Không tìm thấy kế hoạch", HttpStatus.NOT_FOUND));
        validatePlanOwnership(plan, userId);

        plan.setName(request.getName());
        plan.setDescription(request.getDescription());
        if (request.getCurrency() != null) {
            plan.setCurrency(request.getCurrency());
        }
        plan.setIcon(request.getIcon());
        plan.setColor(request.getColor());
        plan.setStartDate(request.getStartDate());
        plan.setEndDate(request.getEndDate());

        plan = spendingPlanRepository.save(plan);
        return toSpendingPlanResponse(plan);
    }

    @Transactional
    public SpendingPlanResponse updatePlanStatus(UUID userId, UUID planId, SpendingPlanStatus status) {
        SpendingPlan plan = spendingPlanRepository.findById(planId)
                .orElseThrow(() -> new ApiException("Không tìm thấy kế hoạch", HttpStatus.NOT_FOUND));
        validatePlanOwnership(plan, userId);

        plan.setStatus(status);
        plan = spendingPlanRepository.save(plan);
        return toSpendingPlanResponse(plan);
    }

    @Transactional
    public void deletePlan(UUID userId, UUID planId) {
        SpendingPlan plan = spendingPlanRepository.findById(planId)
                .orElseThrow(() -> new ApiException("Không tìm thấy kế hoạch", HttpStatus.NOT_FOUND));
        validatePlanOwnership(plan, userId);

        // Refund all expenses before deleting
        for (SpendingPlanItem item : plan.getItems()) {
            for (SpendingPlanExpense expense : item.getExpenses()) {
                Account account = expense.getAccount();
                account.setCurrentBalance(account.getCurrentBalance().add(expense.getAmount()));
                accountRepository.save(account);

                if (expense.getTransaction() != null) {
                    transactionRepository.delete(expense.getTransaction());
                }
            }
        }

        spendingPlanRepository.delete(plan);
    }

    // === ITEM CRUD ===

    @Transactional
    public SpendingPlanItemResponse addItem(UUID userId, UUID planId, SpendingPlanItemRequest request) {
        SpendingPlan plan = spendingPlanRepository.findById(planId)
                .orElseThrow(() -> new ApiException("Không tìm thấy kế hoạch", HttpStatus.NOT_FOUND));
        validatePlanAccess(plan, userId);

        Integer maxSort = itemRepository.findMaxSortOrderByPlanId(planId);
        int sortOrder = request.getSortOrder() != null ? request.getSortOrder() : maxSort + 1;

        SpendingPlanItem item = SpendingPlanItem.builder()
                .plan(plan)
                .name(request.getName())
                .estimatedAmount(request.getEstimatedAmount())
                .icon(request.getIcon())
                .notes(request.getNotes())
                .sortOrder(sortOrder)
                .build();

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ApiException("Không tìm thấy danh mục", HttpStatus.NOT_FOUND));
            item.setCategory(category);
        }

        item = itemRepository.save(item);

        // Recalculate plan totals
        plan.getItems().add(item);
        plan.recalculateTotals();
        spendingPlanRepository.save(plan);

        return toSpendingPlanItemResponse(item);
    }

    @Transactional
    public SpendingPlanItemResponse updateItem(UUID userId, UUID planId, UUID itemId, SpendingPlanItemRequest request) {
        SpendingPlan plan = spendingPlanRepository.findById(planId)
                .orElseThrow(() -> new ApiException("Không tìm thấy kế hoạch", HttpStatus.NOT_FOUND));
        validatePlanAccess(plan, userId);

        SpendingPlanItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ApiException("Không tìm thấy hạng mục", HttpStatus.NOT_FOUND));

        if (!item.getPlan().getId().equals(planId)) {
            throw new ApiException("Hạng mục không thuộc kế hoạch này", HttpStatus.BAD_REQUEST);
        }

        item.setName(request.getName());
        item.setEstimatedAmount(request.getEstimatedAmount());
        item.setIcon(request.getIcon());
        item.setNotes(request.getNotes());
        if (request.getSortOrder() != null) {
            item.setSortOrder(request.getSortOrder());
        }

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ApiException("Không tìm thấy danh mục", HttpStatus.NOT_FOUND));
            item.setCategory(category);
        } else {
            item.setCategory(null);
        }

        item = itemRepository.save(item);

        // Recalculate plan totals
        plan.recalculateTotals();
        spendingPlanRepository.save(plan);

        return toSpendingPlanItemResponse(item);
    }

    @Transactional
    public void deleteItem(UUID userId, UUID planId, UUID itemId) {
        SpendingPlan plan = spendingPlanRepository.findById(planId)
                .orElseThrow(() -> new ApiException("Không tìm thấy kế hoạch", HttpStatus.NOT_FOUND));
        validatePlanOwnership(plan, userId);

        SpendingPlanItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ApiException("Không tìm thấy hạng mục", HttpStatus.NOT_FOUND));

        if (!item.getPlan().getId().equals(planId)) {
            throw new ApiException("Hạng mục không thuộc kế hoạch này", HttpStatus.BAD_REQUEST);
        }

        // Refund all expenses for this item
        for (SpendingPlanExpense expense : item.getExpenses()) {
            Account account = expense.getAccount();
            account.setCurrentBalance(account.getCurrentBalance().add(expense.getAmount()));
            accountRepository.save(account);

            if (expense.getTransaction() != null) {
                transactionRepository.delete(expense.getTransaction());
            }
        }

        plan.getItems().remove(item);
        itemRepository.delete(item);

        plan.recalculateTotals();
        spendingPlanRepository.save(plan);
    }

    public List<SpendingPlanItemResponse> getItems(UUID userId, UUID planId) {
        SpendingPlan plan = spendingPlanRepository.findById(planId)
                .orElseThrow(() -> new ApiException("Không tìm thấy kế hoạch", HttpStatus.NOT_FOUND));
        validatePlanAccess(plan, userId);

        return itemRepository.findByPlanIdOrderBySortOrderAsc(planId).stream()
                .map(this::toSpendingPlanItemResponse)
                .collect(Collectors.toList());
    }

    // === EXPENSE (ACTUAL) ===

    @Transactional
    public SpendingPlanExpenseResponse recordExpense(UUID userId, UUID planId, UUID itemId, SpendingPlanExpenseRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));

        SpendingPlan plan = spendingPlanRepository.findById(planId)
                .orElseThrow(() -> new ApiException("Không tìm thấy kế hoạch", HttpStatus.NOT_FOUND));
        validatePlanAccess(plan, userId);

        if (plan.getStatus() == SpendingPlanStatus.CANCELLED || plan.getStatus() == SpendingPlanStatus.COMPLETED) {
            throw new ApiException("Kế hoạch đã kết thúc hoặc bị hủy", HttpStatus.BAD_REQUEST);
        }

        SpendingPlanItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ApiException("Không tìm thấy hạng mục", HttpStatus.NOT_FOUND));

        if (!item.getPlan().getId().equals(planId)) {
            throw new ApiException("Hạng mục không thuộc kế hoạch này", HttpStatus.BAD_REQUEST);
        }

        Account account = accountRepository.findByIdAndUserId(request.getAccountId(), userId)
                .orElseThrow(() -> new ApiException("Không tìm thấy tài khoản", HttpStatus.NOT_FOUND));

        if (account.getCurrentBalance().compareTo(request.getAmount()) < 0) {
            throw new ApiException("Số dư tài khoản không đủ", HttpStatus.BAD_REQUEST);
        }

        LocalDate expenseDate = request.getExpenseDate() != null ? request.getExpenseDate() : LocalDate.now();

        // Create EXPENSE transaction
        Transaction transaction = Transaction.builder()
                .user(user)
                .account(account)
                .type(TransactionType.EXPENSE)
                .amount(request.getAmount())
                .currency(account.getCurrency())
                .description("Chi tiêu: " + item.getName() + " (" + plan.getName() + ")")
                .transactionDate(expenseDate)
                .build();

        // Set category if item has one
        if (item.getCategory() != null) {
            transaction.setCategory(item.getCategory());
        }

        transaction = transactionRepository.save(transaction);

        // Update account balance
        account.setCurrentBalance(account.getCurrentBalance().subtract(request.getAmount()));
        accountRepository.save(account);

        // Calculate amount in plan currency
        BigDecimal amountInPlanCurrency = request.getAmount();
        if (!account.getCurrency().equalsIgnoreCase(plan.getCurrency())) {
            var convertResult = exchangeRateService.convert(request.getAmount(), account.getCurrency(), plan.getCurrency());
            amountInPlanCurrency = convertResult.getToAmount();
        }

        // Create expense record
        SpendingPlanExpense expense = SpendingPlanExpense.builder()
                .item(item)
                .user(user)
                .account(account)
                .transaction(transaction)
                .amount(request.getAmount())
                .amountInPlanCurrency(amountInPlanCurrency)
                .note(request.getNote())
                .expenseDate(expenseDate)
                .build();

        expense = expenseRepository.save(expense);

        // Update item actual amount
        item.setActualAmount(item.getActualAmount().add(amountInPlanCurrency));
        itemRepository.save(item);

        // Recalculate plan totals
        plan.recalculateTotals();

        // Auto-activate plan if in PLANNING status
        if (plan.getStatus() == SpendingPlanStatus.PLANNING) {
            plan.setStatus(SpendingPlanStatus.ACTIVE);
        }
        spendingPlanRepository.save(plan);

        return toSpendingPlanExpenseResponse(expense, plan.getCurrency());
    }

    @Transactional
    public void deleteExpense(UUID userId, UUID planId, UUID itemId, UUID expenseId) {
        SpendingPlan plan = spendingPlanRepository.findById(planId)
                .orElseThrow(() -> new ApiException("Không tìm thấy kế hoạch", HttpStatus.NOT_FOUND));
        validatePlanAccess(plan, userId);

        SpendingPlanItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ApiException("Không tìm thấy hạng mục", HttpStatus.NOT_FOUND));

        SpendingPlanExpense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ApiException("Không tìm thấy chi tiêu", HttpStatus.NOT_FOUND));

        if (!expense.getItem().getId().equals(itemId)) {
            throw new ApiException("Chi tiêu không thuộc hạng mục này", HttpStatus.BAD_REQUEST);
        }

        // Only allow user to delete their own expense (or owner/admin for family plan)
        if (!expense.getUser().getId().equals(userId)) {
            validatePlanOwnership(plan, userId);
        }

        // Refund the account
        Account account = expense.getAccount();
        account.setCurrentBalance(account.getCurrentBalance().add(expense.getAmount()));
        accountRepository.save(account);

        // Delete the linked transaction
        if (expense.getTransaction() != null) {
            transactionRepository.delete(expense.getTransaction());
        }

        // Update item actual amount
        item.setActualAmount(item.getActualAmount().subtract(expense.getAmountInPlanCurrency()));
        itemRepository.save(item);

        expenseRepository.delete(expense);

        // Recalculate plan totals
        plan.recalculateTotals();
        spendingPlanRepository.save(plan);
    }

    public List<SpendingPlanExpenseResponse> getExpenses(UUID userId, UUID planId, UUID itemId) {
        SpendingPlan plan = spendingPlanRepository.findById(planId)
                .orElseThrow(() -> new ApiException("Không tìm thấy kế hoạch", HttpStatus.NOT_FOUND));
        validatePlanAccess(plan, userId);

        return expenseRepository.findByItemIdOrderByExpenseDateDesc(itemId).stream()
                .map(e -> toSpendingPlanExpenseResponse(e, plan.getCurrency()))
                .collect(Collectors.toList());
    }

    public List<SpendingPlanExpenseResponse> getAllExpenses(UUID userId, UUID planId) {
        SpendingPlan plan = spendingPlanRepository.findById(planId)
                .orElseThrow(() -> new ApiException("Không tìm thấy kế hoạch", HttpStatus.NOT_FOUND));
        validatePlanAccess(plan, userId);

        return expenseRepository.findByPlanIdOrderByExpenseDateDesc(planId).stream()
                .map(e -> toSpendingPlanExpenseResponse(e, plan.getCurrency()))
                .collect(Collectors.toList());
    }

    // === VALIDATION HELPERS ===

    private void validatePlanAccess(SpendingPlan plan, UUID userId) {
        if (plan.getUser() != null && plan.getUser().getId().equals(userId)) {
            return;
        }
        if (plan.getFamily() != null) {
            if (familyMemberRepository.existsByFamilyIdAndUserId(plan.getFamily().getId(), userId)) {
                return;
            }
        }
        throw new ApiException("Bạn không có quyền truy cập kế hoạch này", HttpStatus.FORBIDDEN);
    }

    private void validatePlanOwnership(SpendingPlan plan, UUID userId) {
        if (plan.getUser() != null && plan.getUser().getId().equals(userId)) {
            return;
        }
        if (plan.getFamily() != null) {
            FamilyMember member = familyMemberRepository.findByFamilyIdAndUserId(plan.getFamily().getId(), userId)
                    .orElseThrow(() -> new ApiException("Bạn không phải thành viên", HttpStatus.FORBIDDEN));
            if (member.getRole() == FamilyRole.OWNER || member.getRole() == FamilyRole.ADMIN) {
                return;
            }
        }
        throw new ApiException("Bạn không có quyền chỉnh sửa kế hoạch này", HttpStatus.FORBIDDEN);
    }

    // === MAPPERS ===

    private SpendingPlanResponse toSpendingPlanResponse(SpendingPlan plan) {
        return SpendingPlanResponse.builder()
                .id(plan.getId())
                .name(plan.getName())
                .description(plan.getDescription())
                .currency(plan.getCurrency())
                .icon(plan.getIcon())
                .color(plan.getColor())
                .startDate(plan.getStartDate())
                .endDate(plan.getEndDate())
                .status(plan.getStatus())
                .totalEstimated(plan.getTotalEstimated())
                .totalActual(plan.getTotalActual())
                .remainingAmount(plan.getRemainingAmount())
                .progressPercentage(plan.getProgressPercentage())
                .itemsCount(plan.getItems().size())
                .familyId(plan.getFamily() != null ? plan.getFamily().getId() : null)
                .familyName(plan.getFamily() != null ? plan.getFamily().getName() : null)
                .userId(plan.getUser() != null ? plan.getUser().getId() : null)
                .userName(plan.getUser() != null ? plan.getUser().getFullName() : null)
                .createdAt(plan.getCreatedAt())
                .build();
    }

    private SpendingPlanDetailResponse toSpendingPlanDetailResponse(SpendingPlan plan) {
        List<SpendingPlanItemResponse> items = plan.getItems().stream()
                .map(this::toSpendingPlanItemResponse)
                .collect(Collectors.toList());

        return SpendingPlanDetailResponse.builder()
                .id(plan.getId())
                .name(plan.getName())
                .description(plan.getDescription())
                .currency(plan.getCurrency())
                .icon(plan.getIcon())
                .color(plan.getColor())
                .startDate(plan.getStartDate())
                .endDate(plan.getEndDate())
                .status(plan.getStatus())
                .totalEstimated(plan.getTotalEstimated())
                .totalActual(plan.getTotalActual())
                .remainingAmount(plan.getRemainingAmount())
                .progressPercentage(plan.getProgressPercentage())
                .familyId(plan.getFamily() != null ? plan.getFamily().getId() : null)
                .familyName(plan.getFamily() != null ? plan.getFamily().getName() : null)
                .userId(plan.getUser() != null ? plan.getUser().getId() : null)
                .userName(plan.getUser() != null ? plan.getUser().getFullName() : null)
                .items(items)
                .createdAt(plan.getCreatedAt())
                .build();
    }

    private SpendingPlanItemResponse toSpendingPlanItemResponse(SpendingPlanItem item) {
        return SpendingPlanItemResponse.builder()
                .id(item.getId())
                .planId(item.getPlan().getId())
                .name(item.getName())
                .estimatedAmount(item.getEstimatedAmount())
                .actualAmount(item.getActualAmount())
                .remainingAmount(item.getRemainingAmount())
                .progressPercentage(item.getProgressPercentage())
                .overBudget(item.isOverBudget())
                .categoryId(item.getCategory() != null ? item.getCategory().getId() : null)
                .categoryName(item.getCategory() != null ? item.getCategory().getName() : null)
                .categoryIcon(item.getCategory() != null ? item.getCategory().getIcon() : null)
                .icon(item.getIcon())
                .notes(item.getNotes())
                .sortOrder(item.getSortOrder())
                .expensesCount(item.getExpenses().size())
                .createdAt(item.getCreatedAt())
                .build();
    }

    private SpendingPlanExpenseResponse toSpendingPlanExpenseResponse(SpendingPlanExpense expense, String planCurrency) {
        return SpendingPlanExpenseResponse.builder()
                .id(expense.getId())
                .itemId(expense.getItem().getId())
                .itemName(expense.getItem().getName())
                .userId(expense.getUser().getId())
                .userName(expense.getUser().getFullName())
                .accountId(expense.getAccount().getId())
                .accountName(expense.getAccount().getName())
                .accountCurrency(expense.getAccount().getCurrency())
                .transactionId(expense.getTransaction() != null ? expense.getTransaction().getId() : null)
                .amount(expense.getAmount())
                .amountInPlanCurrency(expense.getAmountInPlanCurrency())
                .planCurrency(planCurrency)
                .note(expense.getNote())
                .expenseDate(expense.getExpenseDate())
                .createdAt(expense.getCreatedAt())
                .build();
    }
}
