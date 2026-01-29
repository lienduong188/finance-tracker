package com.financetracker.scheduler;

import com.financetracker.entity.*;
import com.financetracker.repository.CreditCardPaymentRepository;
import com.financetracker.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class CreditCardPaymentScheduler {

    private final CreditCardPaymentRepository paymentRepository;
    private final NotificationService notificationService;

    // Run daily at 00:30 - mark overdue payments
    @Scheduled(cron = "0 30 0 * * *")
    @Transactional
    public void markOverduePayments() {
        log.info("Marking overdue credit card payments...");

        LocalDate today = LocalDate.now();
        int updated = paymentRepository.markOverduePayments(today);

        log.info("Marked {} payments as overdue", updated);
    }

    // Run daily at 08:00 - send payment reminders
    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void sendPaymentReminders() {
        log.info("Sending credit card payment reminders...");

        LocalDate today = LocalDate.now();
        LocalDate threeDaysLater = today.plusDays(3);

        // Find payments due within 3 days
        List<CreditCardPayment> dueSoon = paymentRepository.findOverduePayments(threeDaysLater)
                .stream()
                .filter(p -> p.getStatus() == PaymentStatus.PENDING)
                .filter(p -> !p.getDueDate().isBefore(today))
                .toList();

        for (CreditCardPayment payment : dueSoon) {
            User user = payment.getPlan().getUser();
            if (!notificationService.hasRecentNotification(
                    user.getId(),
                    NotificationType.CREDIT_CARD_PAYMENT_DUE,
                    24)) {

                int daysUntil = (int) java.time.temporal.ChronoUnit.DAYS.between(today, payment.getDueDate());
                String description = payment.getPlan().getTransaction().getDescription();
                if (description == null || description.isBlank()) {
                    description = "Thanh toán thẻ tín dụng";
                }

                Map<String, Object> data = new HashMap<>();
                data.put("planId", payment.getPlan().getId().toString());
                data.put("paymentId", payment.getId().toString());
                data.put("paymentNumber", payment.getPaymentNumber());

                notificationService.createNotification(
                        user,
                        NotificationType.CREDIT_CARD_PAYMENT_DUE,
                        "Thanh toán thẻ tín dụng sắp đến hạn",
                        String.format("Khoản thanh toán \"%s\" kỳ %d sẽ đến hạn trong %d ngày",
                                description, payment.getPaymentNumber(), daysUntil),
                        data
                );
            }
        }
    }

    // Run daily at 09:00 - notify overdue payments
    @Scheduled(cron = "0 0 9 * * *")
    @Transactional
    public void notifyOverduePayments() {
        log.info("Notifying overdue credit card payments...");

        LocalDate today = LocalDate.now();
        List<CreditCardPayment> overduePayments = paymentRepository.findOverduePayments(today)
                .stream()
                .filter(p -> p.getStatus() == PaymentStatus.OVERDUE)
                .toList();

        for (CreditCardPayment payment : overduePayments) {
            User user = payment.getPlan().getUser();
            if (!notificationService.hasRecentNotification(
                    user.getId(),
                    NotificationType.CREDIT_CARD_PAYMENT_OVERDUE,
                    24)) {

                String description = payment.getPlan().getTransaction().getDescription();
                if (description == null || description.isBlank()) {
                    description = "Thanh toán thẻ tín dụng";
                }

                int daysOverdue = (int) java.time.temporal.ChronoUnit.DAYS.between(payment.getDueDate(), today);

                Map<String, Object> data = new HashMap<>();
                data.put("planId", payment.getPlan().getId().toString());
                data.put("paymentId", payment.getId().toString());
                data.put("paymentNumber", payment.getPaymentNumber());
                data.put("daysOverdue", daysOverdue);

                notificationService.createNotification(
                        user,
                        NotificationType.CREDIT_CARD_PAYMENT_OVERDUE,
                        "Thanh toán thẻ tín dụng quá hạn",
                        String.format("Khoản thanh toán \"%s\" kỳ %d đã quá hạn %d ngày",
                                description, payment.getPaymentNumber(), daysOverdue),
                        data
                );
            }
        }
    }
}
