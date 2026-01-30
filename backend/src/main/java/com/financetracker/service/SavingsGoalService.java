package com.financetracker.service;

import com.financetracker.dto.savings.*;
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
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SavingsGoalService {

    private final SavingsGoalRepository savingsGoalRepository;
    private final SavingsContributionRepository savingsContributionRepository;
    private final FamilyRepository familyRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final NotificationService notificationService;
    private final ExchangeRateService exchangeRateService;

    @Transactional
    public SavingsGoalResponse createGoal(UUID userId, SavingsGoalRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));

        SavingsGoal goal = SavingsGoal.builder()
                .name(request.getName())
                .description(request.getDescription())
                .targetAmount(request.getTargetAmount())
                .currency(request.getCurrency() != null ? request.getCurrency() : user.getDefaultCurrency())
                .icon(request.getIcon())
                .color(request.getColor())
                .targetDate(request.getTargetDate())
                .build();

        if (request.getFamilyId() != null) {
            // Family goal
            Family family = familyRepository.findById(request.getFamilyId())
                    .orElseThrow(() -> new ApiException("Không tìm thấy gia đình", HttpStatus.NOT_FOUND));

            // Verify user is member
            if (!familyMemberRepository.existsByFamilyIdAndUserId(family.getId(), userId)) {
                throw new ApiException("Bạn không phải thành viên của gia đình", HttpStatus.FORBIDDEN);
            }

            goal.setFamily(family);
            goal.setUser(null);
        } else {
            // Personal goal
            goal.setUser(user);
            goal.setFamily(null);
        }

        goal = savingsGoalRepository.save(goal);
        return toSavingsGoalResponse(goal);
    }

    public List<SavingsGoalResponse> getMyGoals(UUID userId) {
        // Get user's family IDs
        List<UUID> familyIds = familyMemberRepository.findByUserId(userId).stream()
                .map(m -> m.getFamily().getId())
                .collect(Collectors.toList());

        List<SavingsGoal> goals;
        if (familyIds.isEmpty()) {
            goals = savingsGoalRepository.findByUserId(userId);
        } else {
            goals = savingsGoalRepository.findAccessibleGoals(userId, familyIds);
        }

        return goals.stream()
                .map(this::toSavingsGoalResponse)
                .collect(Collectors.toList());
    }

    public SavingsGoalResponse getGoal(UUID userId, UUID goalId) {
        SavingsGoal goal = savingsGoalRepository.findById(goalId)
                .orElseThrow(() -> new ApiException("Không tìm thấy mục tiêu", HttpStatus.NOT_FOUND));

        validateGoalAccess(goal, userId);
        return toSavingsGoalResponse(goal);
    }

    @Transactional
    public SavingsGoalResponse updateGoal(UUID userId, UUID goalId, SavingsGoalRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));

        SavingsGoal goal = savingsGoalRepository.findById(goalId)
                .orElseThrow(() -> new ApiException("Không tìm thấy mục tiêu", HttpStatus.NOT_FOUND));

        validateGoalOwnership(goal, userId);

        goal.setName(request.getName());
        goal.setDescription(request.getDescription());
        goal.setTargetAmount(request.getTargetAmount());
        if (request.getCurrency() != null) {
            goal.setCurrency(request.getCurrency());
        }
        goal.setIcon(request.getIcon());
        goal.setColor(request.getColor());
        goal.setTargetDate(request.getTargetDate());

        // Handle family change
        if (request.getFamilyId() != null) {
            // Change to family goal
            Family family = familyRepository.findById(request.getFamilyId())
                    .orElseThrow(() -> new ApiException("Không tìm thấy gia đình", HttpStatus.NOT_FOUND));

            // Verify user is member of the new family
            if (!familyMemberRepository.existsByFamilyIdAndUserId(family.getId(), userId)) {
                throw new ApiException("Bạn không phải thành viên của gia đình", HttpStatus.FORBIDDEN);
            }

            goal.setFamily(family);
            goal.setUser(null);
        } else {
            // Change to personal goal
            goal.setFamily(null);
            goal.setUser(user);
        }

        goal = savingsGoalRepository.save(goal);
        return toSavingsGoalResponse(goal);
    }

    @Transactional
    public void deleteGoal(UUID userId, UUID goalId) {
        SavingsGoal goal = savingsGoalRepository.findById(goalId)
                .orElseThrow(() -> new ApiException("Không tìm thấy mục tiêu", HttpStatus.NOT_FOUND));

        validateGoalOwnership(goal, userId);
        savingsGoalRepository.delete(goal);
    }

    @Transactional
    public SavingsContributionResponse contribute(UUID userId, UUID goalId, SavingsContributionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));

        SavingsGoal goal = savingsGoalRepository.findById(goalId)
                .orElseThrow(() -> new ApiException("Không tìm thấy mục tiêu", HttpStatus.NOT_FOUND));

        validateGoalAccess(goal, userId);

        if (goal.getStatus() != SavingsGoalStatus.ACTIVE) {
            throw new ApiException("Mục tiêu không còn hoạt động", HttpStatus.BAD_REQUEST);
        }

        Account account = accountRepository.findByIdAndUserId(request.getAccountId(), userId)
                .orElseThrow(() -> new ApiException("Không tìm thấy tài khoản", HttpStatus.NOT_FOUND));

        if (account.getCurrentBalance().compareTo(request.getAmount()) < 0) {
            throw new ApiException("Số dư tài khoản không đủ", HttpStatus.BAD_REQUEST);
        }

        // Create EXPENSE transaction
        Transaction transaction = Transaction.builder()
                .user(user)
                .account(account)
                .type(TransactionType.EXPENSE)
                .amount(request.getAmount())
                .currency(account.getCurrency())
                .description("Đóng góp vào mục tiêu: " + goal.getName())
                .transactionDate(request.getContributionDate() != null ? request.getContributionDate() : LocalDate.now())
                .build();

        transaction = transactionRepository.save(transaction);

        // Update account balance
        account.setCurrentBalance(account.getCurrentBalance().subtract(request.getAmount()));
        accountRepository.save(account);

        // Calculate amount in goal currency (convert if different currency)
        BigDecimal amountInGoalCurrency = request.getAmount();
        if (!account.getCurrency().equalsIgnoreCase(goal.getCurrency())) {
            var convertResult = exchangeRateService.convert(request.getAmount(), account.getCurrency(), goal.getCurrency());
            amountInGoalCurrency = convertResult.getToAmount();
        }

        // Create contribution record with converted amount
        SavingsContribution contribution = SavingsContribution.builder()
                .goal(goal)
                .user(user)
                .account(account)
                .transaction(transaction)
                .amount(request.getAmount())
                .amountInGoalCurrency(amountInGoalCurrency)
                .note(request.getNote())
                .contributionDate(request.getContributionDate() != null ? request.getContributionDate() : LocalDate.now())
                .build();

        contribution = savingsContributionRepository.save(contribution);

        boolean wasNotCompleted = goal.getStatus() != SavingsGoalStatus.COMPLETED;
        goal.setCurrentAmount(goal.getCurrentAmount().add(amountInGoalCurrency));
        boolean justCompleted = wasNotCompleted && goal.isCompleted();

        if (justCompleted) {
            goal.setStatus(SavingsGoalStatus.COMPLETED);
        }
        savingsGoalRepository.save(goal);

        // Notify other family members about the contribution (if family goal)
        if (goal.getFamily() != null) {
            List<FamilyMember> members = familyMemberRepository.findByFamilyId(goal.getFamily().getId());
            for (FamilyMember member : members) {
                // Don't notify the contributor themselves
                if (!member.getUser().getId().equals(userId)) {
                    notificationService.notifySavingsContribution(
                            member.getUser(),
                            goal.getName(),
                            user.getFullName(),
                            amountInGoalCurrency,
                            goal.getCurrency()
                    );
                }
            }

            // Notify all members when goal is reached
            if (justCompleted) {
                for (FamilyMember member : members) {
                    notificationService.notifySavingsGoalReached(
                            member.getUser(),
                            goal.getName(),
                            goal.getTargetAmount(),
                            goal.getCurrency()
                    );
                }
            }
        } else if (justCompleted) {
            // Notify the user for personal goal
            notificationService.notifySavingsGoalReached(
                    user,
                    goal.getName(),
                    goal.getTargetAmount(),
                    goal.getCurrency()
            );
        }

        return toSavingsContributionResponse(contribution);
    }

    public List<SavingsContributionResponse> getContributions(UUID userId, UUID goalId) {
        SavingsGoal goal = savingsGoalRepository.findById(goalId)
                .orElseThrow(() -> new ApiException("Không tìm thấy mục tiêu", HttpStatus.NOT_FOUND));

        validateGoalAccess(goal, userId);

        return savingsContributionRepository.findByGoalIdOrderByContributionDateDesc(goalId).stream()
                .map(this::toSavingsContributionResponse)
                .collect(Collectors.toList());
    }

    public List<ContributorSummary> getContributorsSummary(UUID userId, UUID goalId) {
        SavingsGoal goal = savingsGoalRepository.findById(goalId)
                .orElseThrow(() -> new ApiException("Không tìm thấy mục tiêu", HttpStatus.NOT_FOUND));

        validateGoalAccess(goal, userId);

        // Get all contributions and convert to goal currency
        List<SavingsContribution> contributions = savingsContributionRepository.findByGoalIdOrderByContributionDateDesc(goalId);

        // Group by user and sum converted amounts (using stored amountInGoalCurrency)
        java.util.Map<UUID, BigDecimal> userAmounts = new java.util.HashMap<>();
        java.util.Map<UUID, String> userNames = new java.util.HashMap<>();

        for (SavingsContribution contribution : contributions) {
            UUID oderId = contribution.getUser().getId();
            String contributorName = contribution.getUser().getFullName();
            BigDecimal amount = contribution.getAmountInGoalCurrency();

            userAmounts.merge(oderId, amount, BigDecimal::add);
            userNames.put(oderId, contributorName);
        }

        BigDecimal totalAmount = goal.getCurrentAmount();

        List<ContributorSummary> summaries = new ArrayList<>();
        for (java.util.Map.Entry<UUID, BigDecimal> entry : userAmounts.entrySet()) {
            UUID contributorId = entry.getKey();
            BigDecimal amount = entry.getValue();

            double percentage = totalAmount.compareTo(BigDecimal.ZERO) > 0
                    ? amount.divide(totalAmount, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                    : 0;

            summaries.add(ContributorSummary.builder()
                    .userId(contributorId)
                    .userName(userNames.get(contributorId))
                    .totalAmount(amount)
                    .percentage(percentage)
                    .build());
        }

        return summaries;
    }

    @Transactional
    public SavingsContributionResponse updateContribution(UUID userId, UUID goalId, UUID contributionId, SavingsContributionUpdateRequest request) {
        SavingsGoal goal = savingsGoalRepository.findById(goalId)
                .orElseThrow(() -> new ApiException("Không tìm thấy mục tiêu", HttpStatus.NOT_FOUND));

        validateGoalAccess(goal, userId);

        SavingsContribution contribution = savingsContributionRepository.findById(contributionId)
                .orElseThrow(() -> new ApiException("Không tìm thấy đóng góp", HttpStatus.NOT_FOUND));

        if (!contribution.getGoal().getId().equals(goalId)) {
            throw new ApiException("Đóng góp không thuộc mục tiêu này", HttpStatus.BAD_REQUEST);
        }

        // Only allow user to update their own contribution (or admin for family goal)
        if (!contribution.getUser().getId().equals(userId)) {
            validateGoalOwnership(goal, userId);
        }

        // Update fields
        if (request.getNote() != null) {
            contribution.setNote(request.getNote());
        }
        if (request.getContributionDate() != null) {
            contribution.setContributionDate(request.getContributionDate());
            // Also update the linked transaction date
            if (contribution.getTransaction() != null) {
                contribution.getTransaction().setTransactionDate(request.getContributionDate());
                transactionRepository.save(contribution.getTransaction());
            }
        }

        contribution = savingsContributionRepository.save(contribution);
        return toSavingsContributionResponse(contribution);
    }

    @Transactional
    public void deleteContribution(UUID userId, UUID goalId, UUID contributionId) {
        SavingsGoal goal = savingsGoalRepository.findById(goalId)
                .orElseThrow(() -> new ApiException("Không tìm thấy mục tiêu", HttpStatus.NOT_FOUND));

        validateGoalAccess(goal, userId);

        SavingsContribution contribution = savingsContributionRepository.findById(contributionId)
                .orElseThrow(() -> new ApiException("Không tìm thấy đóng góp", HttpStatus.NOT_FOUND));

        if (!contribution.getGoal().getId().equals(goalId)) {
            throw new ApiException("Đóng góp không thuộc mục tiêu này", HttpStatus.BAD_REQUEST);
        }

        // Only allow user to delete their own contribution (or admin for family goal)
        if (!contribution.getUser().getId().equals(userId)) {
            validateGoalOwnership(goal, userId);
        }

        // Refund the account
        Account account = contribution.getAccount();
        account.setCurrentBalance(account.getCurrentBalance().add(contribution.getAmount()));
        accountRepository.save(account);

        // Delete the linked transaction
        if (contribution.getTransaction() != null) {
            transactionRepository.delete(contribution.getTransaction());
        }

        // Update goal current amount using stored converted amount
        goal.setCurrentAmount(goal.getCurrentAmount().subtract(contribution.getAmountInGoalCurrency()));
        if (goal.getStatus() == SavingsGoalStatus.COMPLETED && !goal.isCompleted()) {
            goal.setStatus(SavingsGoalStatus.ACTIVE);
        }
        savingsGoalRepository.save(goal);

        // Delete contribution
        savingsContributionRepository.delete(contribution);
    }

    private void validateGoalAccess(SavingsGoal goal, UUID userId) {
        if (goal.getUser() != null && goal.getUser().getId().equals(userId)) {
            return; // Personal goal, user is owner
        }

        if (goal.getFamily() != null) {
            if (familyMemberRepository.existsByFamilyIdAndUserId(goal.getFamily().getId(), userId)) {
                return; // Family goal, user is member
            }
        }

        throw new ApiException("Bạn không có quyền truy cập mục tiêu này", HttpStatus.FORBIDDEN);
    }

    private void validateGoalOwnership(SavingsGoal goal, UUID userId) {
        if (goal.getUser() != null && goal.getUser().getId().equals(userId)) {
            return; // Personal goal, user is owner
        }

        if (goal.getFamily() != null) {
            FamilyMember member = familyMemberRepository.findByFamilyIdAndUserId(goal.getFamily().getId(), userId)
                    .orElseThrow(() -> new ApiException("Bạn không phải thành viên", HttpStatus.FORBIDDEN));

            if (member.getRole() == FamilyRole.OWNER || member.getRole() == FamilyRole.ADMIN) {
                return; // Family goal, user is owner/admin
            }
        }

        throw new ApiException("Bạn không có quyền chỉnh sửa mục tiêu này", HttpStatus.FORBIDDEN);
    }

    private SavingsGoalResponse toSavingsGoalResponse(SavingsGoal goal) {
        int contributorsCount = (int) savingsContributionRepository.countDistinctUsersByGoalId(goal.getId());

        return SavingsGoalResponse.builder()
                .id(goal.getId())
                .name(goal.getName())
                .description(goal.getDescription())
                .targetAmount(goal.getTargetAmount())
                .currentAmount(goal.getCurrentAmount())
                .currency(goal.getCurrency())
                .icon(goal.getIcon())
                .color(goal.getColor())
                .targetDate(goal.getTargetDate())
                .status(goal.getStatus())
                .familyId(goal.getFamily() != null ? goal.getFamily().getId() : null)
                .familyName(goal.getFamily() != null ? goal.getFamily().getName() : null)
                .userId(goal.getUser() != null ? goal.getUser().getId() : null)
                .userName(goal.getUser() != null ? goal.getUser().getFullName() : null)
                .progressPercentage(goal.getProgressPercentage())
                .contributorsCount(contributorsCount)
                .createdAt(goal.getCreatedAt())
                .build();
    }

    private SavingsContributionResponse toSavingsContributionResponse(SavingsContribution contribution) {
        return SavingsContributionResponse.builder()
                .id(contribution.getId())
                .goalId(contribution.getGoal().getId())
                .userId(contribution.getUser().getId())
                .userName(contribution.getUser().getFullName())
                .accountId(contribution.getAccount().getId())
                .accountName(contribution.getAccount().getName())
                .transactionId(contribution.getTransaction() != null ? contribution.getTransaction().getId() : null)
                .amount(contribution.getAmount())
                .currency(contribution.getAccount().getCurrency())
                .note(contribution.getNote())
                .contributionDate(contribution.getContributionDate())
                .createdAt(contribution.getCreatedAt())
                .build();
    }
}
