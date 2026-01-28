package com.financetracker.service;

import com.financetracker.entity.User;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:noreply@financetracker.com}")
    private String fromEmail;

    @Value("${app.mail.verification-url:http://localhost:5173/verify-email}")
    private String verificationBaseUrl;

    @Autowired(required = false)
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @PostConstruct
    public void init() {
        if (mailSender == null) {
            log.warn("=== EMAIL SERVICE: JavaMailSender NOT configured. Emails will NOT be sent! ===");
        } else {
            log.info("=== EMAIL SERVICE: JavaMailSender configured successfully. From: {} ===", fromEmail);
        }
    }

    @Async
    public void sendVerificationEmail(User user, String token) {
        log.info("Attempting to send verification email to: {}", user.getEmail());

        if (mailSender == null) {
            log.warn("Cannot send verification email - JavaMailSender not configured.");
            log.warn("Verification token for {}: {}", user.getEmail(), token);
            log.warn("Manual verification link: {}?token={}", verificationBaseUrl, token);
            return;
        }

        try {
            String verificationLink = verificationBaseUrl + "?token=" + token;
            log.info("Verification link: {}", verificationLink);

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(user.getEmail());
            message.setSubject("Xac nhan email - Finance Tracker");
            message.setText(
                "Xin chao " + user.getFullName() + ",\n\n" +
                "Cam on ban da dang ky tai khoan Finance Tracker.\n\n" +
                "Vui long click vao link sau de xac nhan email:\n" +
                verificationLink + "\n\n" +
                "Link nay se het han sau 24 gio.\n\n" +
                "Neu ban khong dang ky tai khoan nay, vui long bo qua email nay.\n\n" +
                "Tran trong,\n" +
                "Finance Tracker Team"
            );

            log.info("Sending email from {} to {}", fromEmail, user.getEmail());
            mailSender.send(message);
            log.info("=== Verification email sent successfully to: {} ===", user.getEmail());
        } catch (Exception e) {
            log.error("=== FAILED to send verification email to: {} ===", user.getEmail());
            log.error("Error details: {}", e.getMessage(), e);
        }
    }
}
