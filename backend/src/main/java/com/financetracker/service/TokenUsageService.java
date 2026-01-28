package com.financetracker.service;

import com.financetracker.dto.admin.TokenUsageStatsResponse;
import com.financetracker.entity.TokenUsage;
import com.financetracker.entity.User;
import com.financetracker.repository.TokenUsageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;
import java.time.DayOfWeek;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TokenUsageService {

    private final TokenUsageRepository tokenUsageRepository;

    // Request limits (Groq Free Tier: 14,400 requests/day)
    @Value("${ai.limits.daily-requests:14400}")
    private Long dailyRequestLimit;

    @Value("${ai.limits.weekly-requests:100800}")
    private Long weeklyRequestLimit;

    @Value("${ai.limits.monthly-requests:432000}")
    private Long monthlyRequestLimit;

    // Token limits (for monitoring)
    @Value("${ai.limits.daily-tokens:500000}")
    private Long dailyTokenLimit;

    @Value("${ai.limits.weekly-tokens:3500000}")
    private Long weeklyTokenLimit;

    @Value("${ai.limits.monthly-tokens:15000000}")
    private Long monthlyTokenLimit;

    @Transactional
    public TokenUsage trackUsage(User user, Integer inputTokens, Integer outputTokens,
                                  String model, String feature, String sessionId) {
        TokenUsage usage = TokenUsage.builder()
                .user(user)
                .inputTokens(inputTokens != null ? inputTokens : 0)
                .outputTokens(outputTokens != null ? outputTokens : 0)
                .totalTokens((inputTokens != null ? inputTokens : 0) + (outputTokens != null ? outputTokens : 0))
                .model(model)
                .feature(feature)
                .sessionId(sessionId)
                .build();

        TokenUsage saved = tokenUsageRepository.save(usage);
        log.info("Tracked token usage for user {}: {} tokens (model: {})",
                user.getEmail(), saved.getTotalTokens(), model);
        return saved;
    }

    public Long getUserTotalTokens(UUID userId) {
        Long total = tokenUsageRepository.sumTotalTokensByUserId(userId);
        return total != null ? total : 0L;
    }

    /**
     * Check if global quota allows the request
     * Primary: Check request limits (Groq's main limit)
     * Secondary: Check token limits
     */
    public boolean hasQuotaAvailable() {
        // Check request limits (primary - Groq's main rate limit)
        Long requestsToday = getRequestsToday();
        if (requestsToday >= dailyRequestLimit) {
            log.warn("Daily request limit reached: {} / {}", requestsToday, dailyRequestLimit);
            return false;
        }

        Long requestsThisWeek = getRequestsThisWeek();
        if (requestsThisWeek >= weeklyRequestLimit) {
            log.warn("Weekly request limit reached: {} / {}", requestsThisWeek, weeklyRequestLimit);
            return false;
        }

        Long requestsThisMonth = getRequestsThisMonth();
        if (requestsThisMonth >= monthlyRequestLimit) {
            log.warn("Monthly request limit reached: {} / {}", requestsThisMonth, monthlyRequestLimit);
            return false;
        }

        return true;
    }

    // Request counting methods
    public Long getRequestsToday() {
        OffsetDateTime startOfDay = LocalDate.now().atStartOfDay().atOffset(ZoneOffset.UTC);
        return tokenUsageRepository.countByCreatedAtAfter(startOfDay);
    }

    public Long getRequestsThisWeek() {
        LocalDate today = LocalDate.now();
        LocalDate startOfWeek = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        OffsetDateTime startOfWeekTime = startOfWeek.atStartOfDay().atOffset(ZoneOffset.UTC);
        return tokenUsageRepository.countByCreatedAtAfter(startOfWeekTime);
    }

    public Long getRequestsThisMonth() {
        LocalDate today = LocalDate.now();
        LocalDate startOfMonth = today.withDayOfMonth(1);
        OffsetDateTime startOfMonthTime = startOfMonth.atStartOfDay().atOffset(ZoneOffset.UTC);
        return tokenUsageRepository.countByCreatedAtAfter(startOfMonthTime);
    }

    // Token counting methods
    public Long getTokensToday() {
        OffsetDateTime startOfDay = LocalDate.now().atStartOfDay().atOffset(ZoneOffset.UTC);
        Long tokens = tokenUsageRepository.sumAllTotalTokensSince(startOfDay);
        return tokens != null ? tokens : 0L;
    }

    public Long getTokensThisWeek() {
        LocalDate today = LocalDate.now();
        LocalDate startOfWeek = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        OffsetDateTime startOfWeekTime = startOfWeek.atStartOfDay().atOffset(ZoneOffset.UTC);
        Long tokens = tokenUsageRepository.sumAllTotalTokensSince(startOfWeekTime);
        return tokens != null ? tokens : 0L;
    }

    public Long getTokensThisMonth() {
        LocalDate today = LocalDate.now();
        LocalDate startOfMonth = today.withDayOfMonth(1);
        OffsetDateTime startOfMonthTime = startOfMonth.atStartOfDay().atOffset(ZoneOffset.UTC);
        Long tokens = tokenUsageRepository.sumAllTotalTokensSince(startOfMonthTime);
        return tokens != null ? tokens : 0L;
    }

    public TokenUsageStatsResponse getAdminStats() {
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime sevenDaysAgo = now.minusDays(7);
        OffsetDateTime thirtyDaysAgo = now.minusDays(30);

        // Total tokens
        Long totalTokens = tokenUsageRepository.sumAllTotalTokens();
        Long totalInputTokens = tokenUsageRepository.sumAllInputTokens();
        Long totalOutputTokens = tokenUsageRepository.sumAllOutputTokens();
        Long tokensLast7Days = tokenUsageRepository.sumAllTotalTokensSince(sevenDaysAgo);
        Long tokensLast30Days = tokenUsageRepository.sumAllTotalTokensSince(thirtyDaysAgo);

        // Request counts
        Long totalRequests = tokenUsageRepository.count();
        Long requestsLast7Days = tokenUsageRepository.countByCreatedAtAfter(sevenDaysAgo);
        Long requestsLast30Days = tokenUsageRepository.countByCreatedAtAfter(thirtyDaysAgo);

        // Unique users
        Long uniqueUsers = tokenUsageRepository.countDistinctUsers();
        Long uniqueUsersLast7Days = tokenUsageRepository.countDistinctUsersSince(sevenDaysAgo);
        Long uniqueUsersLast30Days = tokenUsageRepository.countDistinctUsersSince(thirtyDaysAgo);

        // Top users
        List<Object[]> topUsersRaw = tokenUsageRepository.findTopUsersByTokenUsage(PageRequest.of(0, 10));
        List<TokenUsageStatsResponse.TopUserUsage> topUsers = topUsersRaw.stream()
                .map(row -> TokenUsageStatsResponse.TopUserUsage.builder()
                        .id(row[0].toString())
                        .email((String) row[1])
                        .fullName((String) row[2])
                        .totalTokens(((Number) row[3]).longValue())
                        .build())
                .collect(Collectors.toList());

        // Daily usage (last 30 days)
        List<Object[]> dailyUsageRaw = tokenUsageRepository.findDailyUsageSince(thirtyDaysAgo);
        List<TokenUsageStatsResponse.DailyUsage> dailyUsage = dailyUsageRaw.stream()
                .map(row -> TokenUsageStatsResponse.DailyUsage.builder()
                        .date(row[0].toString())
                        .tokens(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());

        // Model usage
        List<Object[]> modelUsageRaw = tokenUsageRepository.findUsageByModel();
        List<TokenUsageStatsResponse.ModelUsage> modelUsage = modelUsageRaw.stream()
                .map(row -> TokenUsageStatsResponse.ModelUsage.builder()
                        .model((String) row[0])
                        .tokens(row[1] != null ? ((Number) row[1]).longValue() : 0L)
                        .requests(row[2] != null ? ((Number) row[2]).longValue() : 0L)
                        .build())
                .collect(Collectors.toList());

        // Current period usage
        Long tokensToday = getTokensToday();
        Long tokensThisWeek = getTokensThisWeek();
        Long tokensThisMonth = getTokensThisMonth();
        Long requestsToday = getRequestsToday();
        Long requestsThisWeek = getRequestsThisWeek();
        Long requestsThisMonth = getRequestsThisMonth();

        return TokenUsageStatsResponse.builder()
                .totalTokens(totalTokens != null ? totalTokens : 0L)
                .totalInputTokens(totalInputTokens != null ? totalInputTokens : 0L)
                .totalOutputTokens(totalOutputTokens != null ? totalOutputTokens : 0L)
                .tokensLast7Days(tokensLast7Days != null ? tokensLast7Days : 0L)
                .tokensLast30Days(tokensLast30Days != null ? tokensLast30Days : 0L)
                .totalRequests(totalRequests)
                .requestsLast7Days(requestsLast7Days)
                .requestsLast30Days(requestsLast30Days)
                .uniqueUsers(uniqueUsers != null ? uniqueUsers : 0L)
                .uniqueUsersLast7Days(uniqueUsersLast7Days != null ? uniqueUsersLast7Days : 0L)
                .uniqueUsersLast30Days(uniqueUsersLast30Days != null ? uniqueUsersLast30Days : 0L)
                .topUsers(topUsers)
                .dailyUsage(dailyUsage)
                .modelUsage(modelUsage)
                // Request limits (Groq Free Tier)
                .dailyRequestLimit(dailyRequestLimit)
                .weeklyRequestLimit(weeklyRequestLimit)
                .monthlyRequestLimit(monthlyRequestLimit)
                .requestsToday(requestsToday)
                .requestsThisWeek(requestsThisWeek)
                .requestsThisMonth(requestsThisMonth)
                .remainingRequestsToday(Math.max(0, dailyRequestLimit - requestsToday))
                .remainingRequestsThisWeek(Math.max(0, weeklyRequestLimit - requestsThisWeek))
                .remainingRequestsThisMonth(Math.max(0, monthlyRequestLimit - requestsThisMonth))
                // Token limits (for monitoring)
                .dailyTokenLimit(dailyTokenLimit)
                .weeklyTokenLimit(weeklyTokenLimit)
                .monthlyTokenLimit(monthlyTokenLimit)
                .tokensToday(tokensToday)
                .tokensThisWeek(tokensThisWeek)
                .tokensThisMonth(tokensThisMonth)
                .remainingTokensToday(Math.max(0, dailyTokenLimit - tokensToday))
                .remainingTokensThisWeek(Math.max(0, weeklyTokenLimit - tokensThisWeek))
                .remainingTokensThisMonth(Math.max(0, monthlyTokenLimit - tokensThisMonth))
                .build();
    }
}
