package com.financetracker.dto.creditcard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkCreditCardPaymentPlanResponse {
    private int totalRequested;
    private int successCount;
    private int failedCount;
    private List<CreditCardPaymentPlanResponse> createdPlans;
    private List<BulkCreateError> errors;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BulkCreateError {
        private String transactionId;
        private String error;
    }
}
