package com.financetracker.service;

import com.financetracker.dto.auth.AuthResponse;
import com.financetracker.dto.auth.ForgotPasswordRequest;
import com.financetracker.dto.auth.LoginRequest;
import com.financetracker.dto.auth.RefreshTokenRequest;
import com.financetracker.dto.auth.RegisterRequest;
import com.financetracker.dto.auth.ResetPasswordRequest;
import com.financetracker.entity.User;
import com.financetracker.exception.ApiException;
import com.financetracker.repository.UserRepository;
import com.financetracker.security.CustomUserDetails;
import com.financetracker.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final GeoLocationService geoLocationService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw ApiException.conflict("Email already registered");
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .defaultCurrency(request.getDefaultCurrency() != null ? request.getDefaultCurrency() : "VND")
                .build();

        user = userRepository.save(user);

        CustomUserDetails userDetails = new CustomUserDetails(user);
        String accessToken = jwtService.generateToken(userDetails, user.getId());
        String refreshToken = jwtService.generateRefreshToken(userDetails, user.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .defaultCurrency(user.getDefaultCurrency())
                .role(user.getRole().name())
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> ApiException.notFound("User"));

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
        String refreshToken = jwtService.generateRefreshToken(userDetails, user.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .defaultCurrency(user.getDefaultCurrency())
                .role(user.getRole().name())
                .build();
    }

    private String getClientIp(HttpServletRequest request) {
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

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String userEmail = jwtService.extractUsername(request.getRefreshToken());

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> ApiException.notFound("User"));

        CustomUserDetails userDetails = new CustomUserDetails(user);

        if (!jwtService.isTokenValid(request.getRefreshToken(), userDetails)) {
            throw ApiException.unauthorized("Invalid refresh token");
        }

        String accessToken = jwtService.generateToken(userDetails, user.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(request.getRefreshToken())
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .defaultCurrency(user.getDefaultCurrency())
                .role(user.getRole().name())
                .build();
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
    }
}
