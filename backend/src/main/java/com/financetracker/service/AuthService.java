package com.financetracker.service;

import com.financetracker.dto.auth.AuthResponse;
import com.financetracker.dto.auth.ForgotPasswordRequest;
import com.financetracker.dto.auth.LoginRequest;
import com.financetracker.dto.auth.LogoutRequest;
import com.financetracker.dto.auth.RefreshTokenRequest;
import com.financetracker.dto.auth.RegisterRequest;
import com.financetracker.dto.auth.ResetPasswordRequest;
import com.financetracker.entity.EmailVerificationToken;
import com.financetracker.entity.RefreshToken;
import com.financetracker.entity.User;
import com.financetracker.exception.ApiException;
import com.financetracker.exception.ErrorCode;
import com.financetracker.repository.EmailVerificationTokenRepository;
import com.financetracker.repository.RefreshTokenRepository;
import com.financetracker.repository.UserRepository;
import com.financetracker.security.CustomUserDetails;
import com.financetracker.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final GeoLocationService geoLocationService;
    private final EmailService emailService;

    @Value("${jwt.refresh-token-expiration:604800000}")
    private long refreshTokenExpiration; // Default 7 days

    @Value("${app.mail.verification-token-expiry-hours:24}")
    private int verificationTokenExpiryHours;

    private static final int MAX_REFRESH_TOKENS_PER_USER = 5;

    @Transactional
    public Map<String, String> register(RegisterRequest request, HttpServletRequest httpRequest) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ApiException(ErrorCode.AUTH_002);
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .defaultCurrency(request.getDefaultCurrency() != null ? request.getDefaultCurrency() : "VND")
                .locale(request.getLocale() != null ? request.getLocale() : "vi")
                .emailVerified(false)
                .build();

        user = userRepository.save(user);

        // Create verification token and send email
        String token = createVerificationToken(user);
        emailService.sendVerificationEmail(user, token);

        return Map.of("message", "Registration successful. Please check your email to verify your account.");
    }

    // Keep backward compatible method
    @Transactional
    public Map<String, String> register(RegisterRequest request) {
        return register(request, null);
    }

    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> ApiException.notFound("User"));

        if (!user.getEmailVerified()) {
            throw new ApiException(ErrorCode.AUTH_006);
        }

        if (!user.getEnabled()) {
            throw new ApiException(ErrorCode.AUTH_005);
        }

        // Update login tracking info
        String clientIp = getClientIp(httpRequest);
        user.setLastLoginAt(OffsetDateTime.now());
        user.setLastLoginIp(clientIp);
        user.setLastUserAgent(httpRequest.getHeader("User-Agent"));

        // Get location from IP (sync call - fast enough for login)
        String location = geoLocationService.getLocation(clientIp);
        user.setLastLoginLocation(location);

        userRepository.save(user);

        CustomUserDetails userDetails = new CustomUserDetails(user);
        String accessToken = jwtService.generateToken(userDetails, user.getId());
        String refreshTokenStr = createRefreshToken(user, httpRequest);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .defaultCurrency(user.getDefaultCurrency())
                .role(user.getRole().name())
                .build();
    }

    private String createRefreshToken(User user, HttpServletRequest httpRequest) {
        // Clean up if user has too many active tokens
        long activeTokenCount = refreshTokenRepository.countByUserAndRevokedFalse(user);
        if (activeTokenCount >= MAX_REFRESH_TOKENS_PER_USER) {
            refreshTokenRepository.revokeAllByUser(user);
        }

        String tokenStr = UUID.randomUUID().toString();
        OffsetDateTime expiresAt = OffsetDateTime.now().plusSeconds(refreshTokenExpiration / 1000);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(tokenStr)
                .expiresAt(expiresAt)
                .deviceInfo(httpRequest != null ? httpRequest.getHeader("User-Agent") : null)
                .ipAddress(httpRequest != null ? getClientIp(httpRequest) : null)
                .build();

        refreshTokenRepository.save(refreshToken);

        return tokenStr;
    }

    private String getClientIp(HttpServletRequest request) {
        if (request == null) return null;
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request, HttpServletRequest httpRequest) {
        RefreshToken refreshToken = refreshTokenRepository.findByTokenAndRevokedFalse(request.getRefreshToken())
                .orElseThrow(() -> new ApiException(ErrorCode.AUTH_003));

        if (!refreshToken.isValid()) {
            throw new ApiException(ErrorCode.AUTH_004);
        }

        User user = refreshToken.getUser();

        if (!user.getEnabled()) {
            throw new ApiException(ErrorCode.AUTH_005);
        }

        // Revoke old token
        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        // Create new tokens (rotation)
        CustomUserDetails userDetails = new CustomUserDetails(user);
        String accessToken = jwtService.generateToken(userDetails, user.getId());
        String newRefreshTokenStr = createRefreshToken(user, httpRequest);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(newRefreshTokenStr)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .defaultCurrency(user.getDefaultCurrency())
                .role(user.getRole().name())
                .build();
    }

    // Keep backward compatible method
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        return refreshToken(request, null);
    }

    @Transactional
    public void logout(LogoutRequest request) {
        refreshTokenRepository.revokeByToken(request.getRefreshToken());
    }

    @Transactional
    public void logoutAll(User user) {
        refreshTokenRepository.revokeAllByUser(user);
    }

    public String forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> ApiException.notFound("User with this email not found"));

        CustomUserDetails userDetails = new CustomUserDetails(user);
        // Generate a short-lived token (15 minutes) for password reset
        return jwtService.generatePasswordResetToken(userDetails, user.getId());
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String userEmail = jwtService.extractUsername(request.getToken());

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> ApiException.notFound("User"));

        CustomUserDetails userDetails = new CustomUserDetails(user);

        if (!jwtService.isPasswordResetTokenValid(request.getToken(), userDetails)) {
            throw ApiException.badRequest("Invalid or expired reset token");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Revoke all refresh tokens on password reset for security
        refreshTokenRepository.revokeAllByUser(user);
    }

    private String createVerificationToken(User user) {
        // Invalidate previous tokens
        emailVerificationTokenRepository.markAllUsedByUser(user);

        String tokenStr = UUID.randomUUID().toString();
        OffsetDateTime expiresAt = OffsetDateTime.now().plusHours(verificationTokenExpiryHours);

        EmailVerificationToken token = EmailVerificationToken.builder()
                .user(user)
                .token(tokenStr)
                .expiresAt(expiresAt)
                .build();

        emailVerificationTokenRepository.save(token);
        return tokenStr;
    }

    @Transactional
    public Map<String, String> verifyEmail(String token) {
        EmailVerificationToken verificationToken = emailVerificationTokenRepository
                .findByTokenAndUsedFalse(token)
                .orElseThrow(() -> new ApiException(ErrorCode.AUTH_007));

        if (verificationToken.isExpired()) {
            throw new ApiException(ErrorCode.AUTH_008);
        }

        User user = verificationToken.getUser();
        user.setEmailVerified(true);
        user.setEnabled(true);  // Activate user after email verification
        userRepository.save(user);

        verificationToken.setUsed(true);
        emailVerificationTokenRepository.save(verificationToken);

        return Map.of("message", "Email verified successfully. You can now login.");
    }

    @Transactional
    public Map<String, String> resendVerification(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> ApiException.notFound("User"));

        if (user.getEmailVerified()) {
            return Map.of("message", "Email is already verified.");
        }

        String token = createVerificationToken(user);
        emailService.sendVerificationEmail(user, token);

        return Map.of("message", "Verification email sent.");
    }
}
