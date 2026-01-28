package com.financetracker.service;

import com.financetracker.entity.User;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class EmailService {

    @Value("${app.mail.resend-api-key:}")
    private String resendApiKey;

    @Value("${app.mail.from:noreply@financetracker.com}")
    private String fromEmail;

    @Value("${app.mail.verification-url:http://localhost:5173/verify-email}")
    private String verificationBaseUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String RESEND_API_URL = "https://api.resend.com/emails";

    @PostConstruct
    public void init() {
        if (resendApiKey == null || resendApiKey.trim().isEmpty()) {
            log.warn("=== EMAIL SERVICE: RESEND_API_KEY not configured. Emails will NOT be sent! ===");
        } else {
            log.info("=== EMAIL SERVICE: Resend API configured. From: {} ===", fromEmail);
        }
    }

    @Async
    public void sendVerificationEmail(User user, String token) {
        log.info("Attempting to send verification email to: {}", user.getEmail());

        if (resendApiKey == null || resendApiKey.trim().isEmpty()) {
            log.warn("Cannot send verification email - RESEND_API_KEY not configured.");
            log.warn("Verification token for {}: {}", user.getEmail(), token);
            log.warn("Manual verification link: {}?token={}", verificationBaseUrl, token);
            return;
        }

        try {
            String verificationLink = verificationBaseUrl + "?token=" + token;
            log.info("Verification link: {}", verificationLink);

            String htmlContent = String.format("""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Xin chào %s,</h2>
                    <p>Cảm ơn bạn đã đăng ký tài khoản Finance Tracker.</p>
                    <p>Vui lòng click vào nút bên dưới để xác nhận email:</p>
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="%s" style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Xác nhận Email
                        </a>
                    </p>
                    <p style="color: #666; font-size: 14px;">Hoặc copy link sau vào trình duyệt:</p>
                    <p style="word-break: break-all; color: #4F46E5;">%s</p>
                    <p style="color: #666; font-size: 14px;">Link này sẽ hết hạn sau 24 giờ.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px;">Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
                    <p style="color: #999; font-size: 12px;">Finance Tracker Team</p>
                </div>
                """, user.getFullName(), verificationLink, verificationLink);

            // Build request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("from", fromEmail);
            requestBody.put("to", List.of(user.getEmail()));
            requestBody.put("subject", "Xác nhận email - Finance Tracker");
            requestBody.put("html", htmlContent);

            // Build headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(resendApiKey);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            log.info("Sending email via Resend API from {} to {}", fromEmail, user.getEmail());
            ResponseEntity<String> response = restTemplate.exchange(
                RESEND_API_URL,
                HttpMethod.POST,
                request,
                String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("=== Verification email sent successfully to: {} ===", user.getEmail());
                log.info("Response: {}", response.getBody());
            } else {
                log.error("Failed to send email. Status: {}, Body: {}", response.getStatusCode(), response.getBody());
            }
        } catch (Exception e) {
            log.error("=== FAILED to send verification email to: {} ===", user.getEmail());
            log.error("Error details: {}", e.getMessage(), e);
        }
    }
}
