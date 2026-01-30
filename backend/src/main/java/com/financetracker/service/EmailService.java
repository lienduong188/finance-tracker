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

    @Value("${app.mail.reset-password-url:http://localhost:5173/reset-password}")
    private String resetPasswordBaseUrl;

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

            String locale = user.getLocale() != null ? user.getLocale() : "vi";
            EmailContent content = getEmailContent(locale, user.getFullName(), verificationLink);

            // Build request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("from", fromEmail);
            requestBody.put("to", List.of(user.getEmail()));
            requestBody.put("subject", content.subject);
            requestBody.put("html", content.html);

            // Build headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(resendApiKey);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            log.info("Sending email via Resend API from {} to {} (locale: {})", fromEmail, user.getEmail(), locale);
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

    @Async
    public void sendPasswordResetEmail(User user, String token) {
        log.info("Attempting to send password reset email to: {}", user.getEmail());

        if (resendApiKey == null || resendApiKey.trim().isEmpty()) {
            log.warn("Cannot send password reset email - RESEND_API_KEY not configured.");
            log.warn("Password reset token for {}: {}", user.getEmail(), token);
            log.warn("Manual reset link: {}?token={}", resetPasswordBaseUrl, token);
            return;
        }

        try {
            String resetLink = resetPasswordBaseUrl + "?token=" + token;
            log.info("Password reset link: {}", resetLink);

            String locale = user.getLocale() != null ? user.getLocale() : "vi";
            EmailContent content = getPasswordResetEmailContent(locale, user.getFullName(), resetLink);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("from", fromEmail);
            requestBody.put("to", List.of(user.getEmail()));
            requestBody.put("subject", content.subject);
            requestBody.put("html", content.html);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(resendApiKey);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            log.info("Sending password reset email via Resend API from {} to {} (locale: {})", fromEmail, user.getEmail(), locale);
            ResponseEntity<String> response = restTemplate.exchange(
                RESEND_API_URL,
                HttpMethod.POST,
                request,
                String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("=== Password reset email sent successfully to: {} ===", user.getEmail());
                log.info("Response: {}", response.getBody());
            } else {
                log.error("Failed to send password reset email. Status: {}, Body: {}", response.getStatusCode(), response.getBody());
            }
        } catch (Exception e) {
            log.error("=== FAILED to send password reset email to: {} ===", user.getEmail());
            log.error("Error details: {}", e.getMessage(), e);
        }
    }

    private EmailContent getPasswordResetEmailContent(String locale, String fullName, String resetLink) {
        return switch (locale) {
            case "ja" -> getJapanesePasswordResetContent(fullName, resetLink);
            case "en" -> getEnglishPasswordResetContent(fullName, resetLink);
            default -> getVietnamesePasswordResetContent(fullName, resetLink);
        };
    }

    private EmailContent getVietnamesePasswordResetContent(String fullName, String resetLink) {
        String subject = "Đặt lại mật khẩu - Finance Tracker";
        String html = String.format("""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Xin chào %s,</h2>
                <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản Finance Tracker của bạn.</p>
                <p>Vui lòng click vào nút bên dưới để đặt lại mật khẩu:</p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="%s" style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Đặt lại mật khẩu
                    </a>
                </p>
                <p style="color: #666; font-size: 14px;">Hoặc copy link sau vào trình duyệt:</p>
                <p style="word-break: break-all; color: #4F46E5;">%s</p>
                <p style="color: #666; font-size: 14px;">Link này sẽ hết hạn sau 15 phút.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
                <p style="color: #999; font-size: 12px;">Finance Tracker Team</p>
            </div>
            """, fullName, resetLink, resetLink);
        return new EmailContent(subject, html);
    }

    private EmailContent getEnglishPasswordResetContent(String fullName, String resetLink) {
        String subject = "Reset your password - Finance Tracker";
        String html = String.format("""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Hello %s,</h2>
                <p>We received a request to reset your Finance Tracker account password.</p>
                <p>Please click the button below to reset your password:</p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="%s" style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Reset Password
                    </a>
                </p>
                <p style="color: #666; font-size: 14px;">Or copy the following link into your browser:</p>
                <p style="word-break: break-all; color: #4F46E5;">%s</p>
                <p style="color: #666; font-size: 14px;">This link will expire in 15 minutes.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">If you did not request a password reset, please ignore this email.</p>
                <p style="color: #999; font-size: 12px;">Finance Tracker Team</p>
            </div>
            """, fullName, resetLink, resetLink);
        return new EmailContent(subject, html);
    }

    private EmailContent getJapanesePasswordResetContent(String fullName, String resetLink) {
        String subject = "パスワードをリセット - Finance Tracker";
        String html = String.format("""
            <div style="font-family: 'Hiragino Sans', 'Meiryo', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">%s 様</h2>
                <p>Finance Trackerアカウントのパスワードリセットリクエストを受け取りました。</p>
                <p>下のボタンをクリックして、パスワードをリセットしてください：</p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="%s" style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        パスワードをリセット
                    </a>
                </p>
                <p style="color: #666; font-size: 14px;">または、以下のリンクをブラウザにコピーしてください：</p>
                <p style="word-break: break-all; color: #4F46E5;">%s</p>
                <p style="color: #666; font-size: 14px;">このリンクは15分後に有効期限が切れます。</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">パスワードのリセットをリクエストしていない場合は、このメールを無視してください。</p>
                <p style="color: #999; font-size: 12px;">Finance Tracker チーム</p>
            </div>
            """, fullName, resetLink, resetLink);
        return new EmailContent(subject, html);
    }

    private record EmailContent(String subject, String html) {}

    private EmailContent getEmailContent(String locale, String fullName, String verificationLink) {
        return switch (locale) {
            case "ja" -> getJapaneseEmailContent(fullName, verificationLink);
            case "en" -> getEnglishEmailContent(fullName, verificationLink);
            default -> getVietnameseEmailContent(fullName, verificationLink);
        };
    }

    private EmailContent getVietnameseEmailContent(String fullName, String verificationLink) {
        String subject = "Xác nhận email - Finance Tracker";
        String html = String.format("""
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
            """, fullName, verificationLink, verificationLink);
        return new EmailContent(subject, html);
    }

    private EmailContent getEnglishEmailContent(String fullName, String verificationLink) {
        String subject = "Verify your email - Finance Tracker";
        String html = String.format("""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Hello %s,</h2>
                <p>Thank you for registering for a Finance Tracker account.</p>
                <p>Please click the button below to verify your email:</p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="%s" style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Verify Email
                    </a>
                </p>
                <p style="color: #666; font-size: 14px;">Or copy the following link into your browser:</p>
                <p style="word-break: break-all; color: #4F46E5;">%s</p>
                <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">If you did not register for this account, please ignore this email.</p>
                <p style="color: #999; font-size: 12px;">Finance Tracker Team</p>
            </div>
            """, fullName, verificationLink, verificationLink);
        return new EmailContent(subject, html);
    }

    private EmailContent getJapaneseEmailContent(String fullName, String verificationLink) {
        String subject = "メール認証 - Finance Tracker";
        String html = String.format("""
            <div style="font-family: 'Hiragino Sans', 'Meiryo', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">%s 様</h2>
                <p>Finance Trackerへのご登録ありがとうございます。</p>
                <p>下のボタンをクリックして、メールアドレスを認証してください：</p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="%s" style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        メールを認証する
                    </a>
                </p>
                <p style="color: #666; font-size: 14px;">または、以下のリンクをブラウザにコピーしてください：</p>
                <p style="word-break: break-all; color: #4F46E5;">%s</p>
                <p style="color: #666; font-size: 14px;">このリンクは24時間後に有効期限が切れます。</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">このアカウントを登録していない場合は、このメールを無視してください。</p>
                <p style="color: #999; font-size: 12px;">Finance Tracker チーム</p>
            </div>
            """, fullName, verificationLink, verificationLink);
        return new EmailContent(subject, html);
    }
}
