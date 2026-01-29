package com.financetracker.dto.creditcard;

import com.financetracker.entity.PaymentPlanStatus;
import com.financetracker.entity.PaymentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreditCardPaymentPlanResponse {

    private UUID id;
    private UUID transactionId;
    private String transactionDescription;
    private LocalDate transactionDate;
    private UUID accountId;
    private String accountName;

    private PaymentType paymentType;
    private BigDecimal originalAmount;
    private BigDecimal totalAmountWithFee;
    private BigDecimal remainingAmount;
    private String currency;
    private LocalDate startDate;
    private LocalDate nextPaymentDate;

    // Installment specific
    private Integer totalInstallments;
    private Integer completedInstallments;
    private BigDecimal installmentAmount;
    private BigDecimal installmentFeeRate;

    // Revolving specific
    private BigDecimal monthlyPayment;
    private BigDecimal interestRate;

    private PaymentPlanStatus status;

    private List<CreditCardPaymentResponse> payments;

    private OffsetDateTime createdAt;
}
