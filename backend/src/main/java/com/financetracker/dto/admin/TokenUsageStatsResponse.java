package com.financetracker.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TokenUsageStatsResponse {
    private Long totalTokens;
    private Long totalInputTokens;
    private Long totalOutputTokens;
    private Long tokensLast7Days;
    private Long tokensLast30Days;
    private Long totalRequests;
    private Long requestsLast7Days;
    private Long requestsLast30Days;
    private Long uniqueUsers;
    private Long uniqueUsersLast7Days;
    private Long uniqueUsersLast30Days;
    private List<TopUserUsage> topUsers;
    private List<DailyUsage> dailyUsage;
    private List<ModelUsage> modelUsage;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopUserUsage {
        private String id;
        private String email;
        private String fullName;
        private Long totalTokens;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyUsage {
        private String date;
        private Long tokens;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModelUsage {
        private String model;
        private Long tokens;
        private Long requests;
    }
}
