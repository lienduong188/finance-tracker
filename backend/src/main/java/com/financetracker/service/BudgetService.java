package com.financetracker.service;

import com.financetracker.dto.budget.BudgetRequest;
import com.financetracker.dto.budget.BudgetResponse;
import com.financetracker.entity.*;
import com.financetracker.exception.ApiException;
import com.financetracker.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final FamilyRepository familyRepository;
    private final FamilyMemberRepository familyMemberRepository;

    public List<BudgetResponse> getAllBudgets(UUID userId) {
        // Get user's family IDs
        List<UUID> familyIds = familyMemberRepository.findByUserId(userId).stream()
                .map(m -> m.getFamily().getId())
                .collect(Collectors.toList());

        List<Budget> budgets;
        if (familyIds.isEmpty()) {
            budgets = budgetRepository.findByUserIdAndIsActiveTrue(userId);
        } else {
            budgets = budgetRepository.findAccessibleActiveBudgets(userId, familyIds);
        }

        return budgets.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // Get budgets for a specific family
    public List<BudgetResponse> getFamilyBudgets(UUID userId, UUID familyId) {
        // Verify user is member
        if (!familyMemberRepository.existsByFamilyIdAndUserId(familyId, userId)) {
            throw new ApiException("Bạn không phải thành viên của nhóm", HttpStatus.FORBIDDEN);
        }

        return budgetRepository.findByFamilyIdAndIsActiveTrue(familyId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public BudgetResponse getBudget(UUID userId, UUID budgetId) {
        Budget budget = budgetRepository.findByIdAndUserId(budgetId, userId)
                .orElseThrow(() -> ApiException.notFound("Budget"));
        return toResponse(budget);
    }

    @Transactional
    public BudgetResponse createBudget(UUID userId, BudgetRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User"));

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findByIdAndUserIdOrSystem(request.getCategoryId(), userId)
                    .orElseThrow(() -> ApiException.notFound("Category"));
        }

        Family family = null;
        if (request.getFamilyId() != null) {
            family = familyRepository.findById(request.getFamilyId())
                    .orElseThrow(() -> new ApiException("Không tìm thấy nhóm", HttpStatus.NOT_FOUND));

            // Verify user is member with permission
            FamilyMember member = familyMemberRepository.findByFamilyIdAndUserId(family.getId(), userId)
                    .orElseThrow(() -> new ApiException("Bạn không phải thành viên của nhóm", HttpStatus.FORBIDDEN));

            if (member.getRole() != FamilyRole.OWNER && member.getRole() != FamilyRole.ADMIN) {
                throw new ApiException("Chỉ Owner hoặc Admin mới có thể tạo ngân sách nhóm", HttpStatus.FORBIDDEN);
            }
        }

        Budget budget = Budget.builder()
                .user(family == null ? user : null)  // Personal budget has user, family budget doesn't
                .family(family)
                .name(request.getName())
                .category(category)
                .amount(request.getAmount())
                .currency(request.getCurrency() != null ? request.getCurrency() :
                        (family != null ? family.getCurrency() : user.getDefaultCurrency()))
                .period(request.getPeriod())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .alertThreshold(request.getAlertThreshold() != null ? request.getAlertThreshold() : 80)
                .spentAmount(BigDecimal.ZERO)
                .isActive(true)
                .build();

        budget = budgetRepository.save(budget);
        calculateAndUpdateSpentAmount(budget);

        return toResponse(budget);
    }

    @Transactional
    public BudgetResponse updateBudget(UUID userId, UUID budgetId, BudgetRequest request) {
        Budget budget = budgetRepository.findByIdAndUserId(budgetId, userId)
                .orElseThrow(() -> ApiException.notFound("Budget"));

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findByIdAndUserIdOrSystem(request.getCategoryId(), userId)
                    .orElseThrow(() -> ApiException.notFound("Category"));
        }

        budget.setName(request.getName());
        budget.setCategory(category);
        budget.setAmount(request.getAmount());
        budget.setCurrency(request.getCurrency());
        budget.setPeriod(request.getPeriod());
        budget.setStartDate(request.getStartDate());
        budget.setEndDate(request.getEndDate());
        budget.setAlertThreshold(request.getAlertThreshold());

        budget = budgetRepository.save(budget);
        calculateAndUpdateSpentAmount(budget);

        return toResponse(budget);
    }

    @Transactional
    public void deleteBudget(UUID userId, UUID budgetId) {
        Budget budget = budgetRepository.findByIdAndUserId(budgetId, userId)
                .orElseThrow(() -> ApiException.notFound("Budget"));
        budget.setIsActive(false);
        budgetRepository.save(budget);
    }

    @Transactional
    public void updateBudgetSpentAmount(UUID userId, UUID categoryId, LocalDate transactionDate) {
        List<Budget> budgets = budgetRepository.findByCategoryIdAndActive(userId, categoryId);
        for (Budget budget : budgets) {
            calculateAndUpdateSpentAmount(budget);
        }
    }

    private void calculateAndUpdateSpentAmount(Budget budget) {
        LocalDate[] dateRange = getBudgetDateRange(budget);
        BigDecimal spentAmount = BigDecimal.ZERO;

        if (budget.getCategory() != null) {
            BigDecimal sum = transactionRepository.sumByCategoryIdAndDateRange(
                    budget.getUser().getId(),
                    budget.getCategory().getId(),
                    dateRange[0],
                    dateRange[1]
            );
            spentAmount = sum != null ? sum : BigDecimal.ZERO;
        }

        budget.setSpentAmount(spentAmount);
        budgetRepository.save(budget);
    }

    private LocalDate[] getBudgetDateRange(Budget budget) {
        LocalDate today = LocalDate.now();
        LocalDate startDate = budget.getStartDate();
        LocalDate endDate = budget.getEndDate();

        switch (budget.getPeriod()) {
            case DAILY:
                startDate = today;
                endDate = today;
                break;
            case WEEKLY:
                startDate = today.with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
                endDate = startDate.plusDays(6);
                break;
            case MONTHLY:
                startDate = today.with(TemporalAdjusters.firstDayOfMonth());
                endDate = today.with(TemporalAdjusters.lastDayOfMonth());
                break;
            case YEARLY:
                startDate = today.with(TemporalAdjusters.firstDayOfYear());
                endDate = today.with(TemporalAdjusters.lastDayOfYear());
                break;
            case CUSTOM:
                // Use the budget's start and end dates
                break;
        }

        return new LocalDate[]{startDate, endDate != null ? endDate : LocalDate.MAX};
    }

    private BudgetResponse toResponse(Budget budget) {
        BigDecimal spentAmount = budget.getSpentAmount() != null ? budget.getSpentAmount() : BigDecimal.ZERO;
        BigDecimal remainingAmount = budget.getAmount().subtract(spentAmount);
        double spentPercentage = budget.getAmount().compareTo(BigDecimal.ZERO) > 0
                ? spentAmount.divide(budget.getAmount(), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                : 0;

        return BudgetResponse.builder()
                .id(budget.getId())
                .name(budget.getName())
                .categoryId(budget.getCategory() != null ? budget.getCategory().getId() : null)
                .categoryName(budget.getCategory() != null ? budget.getCategory().getName() : null)
                .categoryIcon(budget.getCategory() != null ? budget.getCategory().getIcon() : null)
                .familyId(budget.getFamily() != null ? budget.getFamily().getId() : null)
                .familyName(budget.getFamily() != null ? budget.getFamily().getName() : null)
                .amount(budget.getAmount())
                .currency(budget.getCurrency())
                .period(budget.getPeriod())
                .startDate(budget.getStartDate())
                .endDate(budget.getEndDate())
                .spentAmount(spentAmount)
                .remainingAmount(remainingAmount)
                .spentPercentage(spentPercentage)
                .alertThreshold(budget.getAlertThreshold())
                .isActive(budget.getIsActive())
                .isOverBudget(spentPercentage > 100)
                .isNearLimit(spentPercentage >= budget.getAlertThreshold() && spentPercentage <= 100)
                .createdAt(budget.getCreatedAt())
                .build();
    }
}
