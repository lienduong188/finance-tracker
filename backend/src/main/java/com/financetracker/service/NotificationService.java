package com.financetracker.service;

import com.financetracker.dto.notification.NotificationResponse;
import com.financetracker.entity.*;
import com.financetracker.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    // Get all notifications for user (paginated)
    public Page<NotificationResponse> getNotifications(UUID userId, int page, int size) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size))
                .map(this::toResponse);
    }

    // Get unread notifications
    public List<NotificationResponse> getUnreadNotifications(UUID userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // Count unread notifications
    public long countUnread(UUID userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    // Mark single notification as read
    @Transactional
    public void markAsRead(UUID userId, UUID notificationId) {
        notificationRepository.markAsRead(notificationId, userId);
    }

    // Mark all as read
    @Transactional
    public void markAllAsRead(UUID userId) {
        notificationRepository.markAllAsRead(userId);
    }

    // Create notification
    @Transactional
    public Notification createNotification(User user, NotificationType type, String title, String message, Map<String, Object> data) {
        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .message(message)
                .data(data)
                .build();
        return notificationRepository.save(notification);
    }

    // Check if similar notification exists recently (avoid spam)
    public boolean hasRecentNotification(UUID userId, NotificationType type, int hours) {
        OffsetDateTime after = OffsetDateTime.now().minusHours(hours);
        return notificationRepository.existsByUserIdAndTypeAndCreatedAtAfter(userId, type, after);
    }

    // === Specific notification creators ===

    // Invitation received
    public void notifyInvitationReceived(User invitee, String familyName, String inviterName) {
        Map<String, Object> data = new HashMap<>();
        data.put("familyName", familyName);
        data.put("inviterName", inviterName);

        createNotification(
                invitee,
                NotificationType.INVITATION_RECEIVED,
                "Lời mời tham gia nhóm",
                String.format("%s đã mời bạn tham gia nhóm \"%s\"", inviterName, familyName),
                data
        );
    }

    // Invitation accepted - notify inviter
    public void notifyInvitationAccepted(User inviter, String inviteeName, String familyName) {
        Map<String, Object> data = new HashMap<>();
        data.put("inviteeName", inviteeName);
        data.put("familyName", familyName);

        createNotification(
                inviter,
                NotificationType.INVITATION_ACCEPTED,
                "Lời mời được chấp nhận",
                String.format("%s đã chấp nhận lời mời tham gia nhóm \"%s\"", inviteeName, familyName),
                data
        );
    }

    // Recurring transaction due soon
    public void notifyRecurringDueSoon(User user, String transactionName, int daysUntilDue) {
        Map<String, Object> data = new HashMap<>();
        data.put("transactionName", transactionName);
        data.put("daysUntilDue", daysUntilDue);

        createNotification(
                user,
                NotificationType.RECURRING_DUE_SOON,
                "Giao dịch định kỳ sắp đến hạn",
                String.format("Giao dịch \"%s\" sẽ đến hạn trong %d ngày", transactionName, daysUntilDue),
                data
        );
    }

    // Debt due soon
    public void notifyDebtDueSoon(User user, String debtName, int daysUntilDue, BigDecimal amount, String currency) {
        Map<String, Object> data = new HashMap<>();
        data.put("debtName", debtName);
        data.put("daysUntilDue", daysUntilDue);
        data.put("amount", amount);
        data.put("currency", currency);

        createNotification(
                user,
                NotificationType.DEBT_DUE_SOON,
                "Khoản vay/nợ sắp đến hạn",
                String.format("Khoản \"%s\" (%s %s) sẽ đến hạn trong %d ngày", debtName, amount, currency, daysUntilDue),
                data
        );
    }

    // Budget warning (80%)
    public void notifyBudgetWarning(User user, String categoryName, int percentage) {
        Map<String, Object> data = new HashMap<>();
        data.put("categoryName", categoryName);
        data.put("percentage", percentage);

        createNotification(
                user,
                NotificationType.BUDGET_WARNING,
                "Cảnh báo ngân sách",
                String.format("Ngân sách cho \"%s\" đã đạt %d%%", categoryName, percentage),
                data
        );
    }

    // Budget exceeded (100%+)
    public void notifyBudgetExceeded(User user, String categoryName, int percentage) {
        Map<String, Object> data = new HashMap<>();
        data.put("categoryName", categoryName);
        data.put("percentage", percentage);

        createNotification(
                user,
                NotificationType.BUDGET_EXCEEDED,
                "Vượt ngân sách",
                String.format("Ngân sách cho \"%s\" đã vượt %d%%!", categoryName, percentage),
                data
        );
    }

    // Account empty or low balance
    public void notifyAccountLowBalance(User user, String accountName, BigDecimal balance, String currency) {
        Map<String, Object> data = new HashMap<>();
        data.put("accountName", accountName);
        data.put("balance", balance);
        data.put("currency", currency);

        NotificationType type = balance.compareTo(BigDecimal.ZERO) <= 0
                ? NotificationType.ACCOUNT_EMPTY
                : NotificationType.ACCOUNT_LOW_BALANCE;

        String title = balance.compareTo(BigDecimal.ZERO) <= 0
                ? "Tài khoản hết tiền"
                : "Tài khoản sắp hết tiền";

        createNotification(
                user,
                type,
                title,
                String.format("Tài khoản \"%s\" còn %s %s", accountName, balance, currency),
                data
        );
    }

    // Exchange rate alert
    public void notifyExchangeRateAlert(User user, String fromCurrency, String toCurrency, BigDecimal rate) {
        Map<String, Object> data = new HashMap<>();
        data.put("fromCurrency", fromCurrency);
        data.put("toCurrency", toCurrency);
        data.put("rate", rate);

        createNotification(
                user,
                NotificationType.EXCHANGE_RATE_ALERT,
                "Cảnh báo tỷ giá",
                String.format("Tỷ giá %s/%s đã đạt 1:%s", fromCurrency, toCurrency, rate.setScale(0)),
                data
        );
    }

    // Savings goal contribution
    public void notifySavingsContribution(User user, String goalName, String contributorName, BigDecimal amount, String currency) {
        Map<String, Object> data = new HashMap<>();
        data.put("goalName", goalName);
        data.put("contributorName", contributorName);
        data.put("amount", amount);
        data.put("currency", currency);

        createNotification(
                user,
                NotificationType.SAVINGS_CONTRIBUTION,
                "Đóng góp tiết kiệm mới",
                String.format("%s đã đóng góp %s %s vào mục tiêu \"%s\"", contributorName, amount, currency, goalName),
                data
        );
    }

    // Savings goal reached
    public void notifySavingsGoalReached(User user, String goalName, BigDecimal targetAmount, String currency) {
        Map<String, Object> data = new HashMap<>();
        data.put("goalName", goalName);
        data.put("targetAmount", targetAmount);
        data.put("currency", currency);

        createNotification(
                user,
                NotificationType.SAVINGS_GOAL_REACHED,
                "Đạt mục tiêu tiết kiệm!",
                String.format("Chúc mừng! Mục tiêu \"%s\" đã đạt %s %s", goalName, targetAmount, currency),
                data
        );
    }

    // Member joined group
    public void notifyMemberJoined(User user, String memberName, String familyName) {
        Map<String, Object> data = new HashMap<>();
        data.put("memberName", memberName);
        data.put("familyName", familyName);

        createNotification(
                user,
                NotificationType.MEMBER_JOINED,
                "Thành viên mới",
                String.format("%s đã tham gia nhóm \"%s\"", memberName, familyName),
                data
        );
    }

    // Member left group
    public void notifyMemberLeft(User user, String memberName, String familyName) {
        Map<String, Object> data = new HashMap<>();
        data.put("memberName", memberName);
        data.put("familyName", familyName);

        createNotification(
                user,
                NotificationType.MEMBER_LEFT,
                "Thành viên rời nhóm",
                String.format("%s đã rời khỏi nhóm \"%s\"", memberName, familyName),
                data
        );
    }

    // Delete old read notifications
    @Transactional
    public int deleteOldNotifications(OffsetDateTime before) {
        return notificationRepository.deleteOldReadNotifications(before);
    }

    private NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .data(notification.getData())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
