package com.financetracker.scheduler;

import com.financetracker.entity.*;
import com.financetracker.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Scheduler to permanently delete user data after the 7-day grace period.
 * User basic info (id, email, fullName, etc.) is kept for admin reference.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AccountDeletionScheduler {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final BudgetRepository budgetRepository;
    private final RecurringTransactionRepository recurringTransactionRepository;
    private final DebtRepository debtRepository;
    private final CreditCardPaymentPlanRepository creditCardPaymentPlanRepository;
    private final CreditCardPaymentRepository creditCardPaymentRepository;
    private final SavingsGoalRepository savingsGoalRepository;
    private final SavingsContributionRepository savingsContributionRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final FamilyRepository familyRepository;
    private final InvitationRepository invitationRepository;
    private final NotificationRepository notificationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final TokenUsageRepository tokenUsageRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;

    /**
     * Run daily at 1:00 AM to process account deletions
     */
    @Scheduled(cron = "0 0 1 * * *")
    @Transactional
    public void processAccountDeletions() {
        log.info("Processing scheduled account deletions...");

        OffsetDateTime now = OffsetDateTime.now();
        List<User> usersToProcess = userRepository
                .findByDeletionScheduledAtBeforeAndDeletionScheduledAtIsNotNull(now);

        log.info("Found {} users pending data deletion", usersToProcess.size());

        for (User user : usersToProcess) {
            try {
                deleteUserData(user);
                log.info("Successfully deleted data for user: {}", user.getEmail());
            } catch (Exception e) {
                log.error("Failed to delete data for user: {}. Error: {}", user.getEmail(), e.getMessage(), e);
            }
        }

        log.info("Account deletion processing completed");
    }

    /**
     * Delete all user data except basic user info
     */
    private void deleteUserData(User user) {
        UUID userId = user.getId();
        log.info("Deleting data for user: {} ({})", user.getEmail(), userId);

        // 1. Delete credit card payments first (depends on payment plans)
        List<CreditCardPaymentPlan> plans = creditCardPaymentPlanRepository.findByUserId(userId);
        for (CreditCardPaymentPlan plan : plans) {
            creditCardPaymentRepository.deleteByPaymentPlanId(plan.getId());
        }
        creditCardPaymentPlanRepository.deleteAll(plans);
        log.debug("Deleted credit card payment plans for user: {}", userId);

        // 2. Delete savings contributions (before savings goals)
        savingsContributionRepository.deleteByUserId(userId);
        log.debug("Deleted savings contributions for user: {}", userId);

        // 3. Delete personal savings goals (not group goals)
        savingsGoalRepository.deleteByUserIdAndFamilyIsNull(userId);
        log.debug("Deleted personal savings goals for user: {}", userId);

        // 4. Handle family memberships
        handleFamilyMemberships(user);
        log.debug("Handled family memberships for user: {}", userId);

        // 5. Delete invitations sent by user
        invitationRepository.deleteByInviterId(userId);
        log.debug("Deleted invitations for user: {}", userId);

        // 6. Delete debts
        debtRepository.deleteByUserId(userId);
        log.debug("Deleted debts for user: {}", userId);

        // 7. Delete recurring transactions
        recurringTransactionRepository.deleteByUserId(userId);
        log.debug("Deleted recurring transactions for user: {}", userId);

        // 8. Delete notifications
        notificationRepository.deleteByUserId(userId);
        log.debug("Deleted notifications for user: {}", userId);

        // 9. Delete chat messages and token usage
        chatMessageRepository.deleteAllByUserId(userId);
        tokenUsageRepository.deleteByUserId(userId);
        log.debug("Deleted chat messages and token usage for user: {}", userId);

        // 10. Delete tokens
        refreshTokenRepository.deleteByUserId(userId);
        emailVerificationTokenRepository.deleteByUserId(userId);
        log.debug("Deleted tokens for user: {}", userId);

        // 11. Delete transactions (before accounts due to foreign keys)
        transactionRepository.deleteByUserId(userId);
        log.debug("Deleted transactions for user: {}", userId);

        // 12. Delete budgets
        budgetRepository.deleteByUserId(userId);
        log.debug("Deleted budgets for user: {}", userId);

        // 13. Delete categories (custom ones)
        categoryRepository.deleteByUserIdAndIsSystemFalse(userId);
        log.debug("Deleted custom categories for user: {}", userId);

        // 14. Delete accounts
        accountRepository.deleteByUserId(userId);
        log.debug("Deleted accounts for user: {}", userId);

        // 15. Clear deletion scheduled date (data is now deleted, keep user record for admin)
        user.setDeletionScheduledAt(null);
        // Keep deletedAt to mark that user was deleted
        userRepository.save(user);

        log.info("All data deleted for user: {}", user.getEmail());
    }

    /**
     * Handle family membership cleanup when user is deleted
     */
    private void handleFamilyMemberships(User user) {
        List<FamilyMember> memberships = familyMemberRepository.findByUserId(user.getId());

        for (FamilyMember membership : memberships) {
            Family family = membership.getFamily();

            if (membership.getRole() == FamilyRole.OWNER) {
                // Try to transfer ownership to another admin
                List<FamilyMember> admins = familyMemberRepository
                        .findByFamilyIdAndRoleAndUserIdNot(family.getId(), FamilyRole.ADMIN, user.getId());

                if (!admins.isEmpty()) {
                    // Promote first admin to owner
                    FamilyMember newOwner = admins.get(0);
                    newOwner.setRole(FamilyRole.OWNER);
                    familyMemberRepository.save(newOwner);
                    log.info("Transferred ownership of family {} to {}", family.getName(), newOwner.getUser().getEmail());
                } else {
                    // Check if there are other members
                    List<FamilyMember> members = familyMemberRepository
                            .findByFamilyIdAndUserIdNot(family.getId(), user.getId());

                    if (!members.isEmpty()) {
                        // Promote first member to owner
                        FamilyMember newOwner = members.get(0);
                        newOwner.setRole(FamilyRole.OWNER);
                        familyMemberRepository.save(newOwner);
                        log.info("Transferred ownership of family {} to {}", family.getName(), newOwner.getUser().getEmail());
                    } else {
                        // Delete the family if no other members
                        // First delete group savings goals
                        savingsGoalRepository.deleteByFamilyId(family.getId());
                        // Delete invitations for this family
                        invitationRepository.deleteByFamilyId(family.getId());
                        // Delete family
                        familyRepository.delete(family);
                        log.info("Deleted family {} (no remaining members)", family.getName());
                        continue; // Skip deleting membership since family is deleted
                    }
                }
            }

            // Delete the membership
            familyMemberRepository.delete(membership);
        }
    }
}
