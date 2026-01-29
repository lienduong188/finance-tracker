package com.financetracker.dto.creditcard;

import com.financetracker.entity.PaymentType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreditCardPaymentPlanRequest {

    @NotNull(message = "Transaction ID is required")
    private UUID transactionId;

    @NotNull(message = "Payment type is required")
    private PaymentType paymentType;

    // For INSTALLMENT
    @Min(value = 2, message = "Minimum installments is 2")
    private Integer totalInstallments;

    @Positive(message = "Fee rate must be positive")
    private BigDecimal installmentFeeRate;

    // For REVOLVING
    @Positive(message = "Monthly payment must be positive")
    private BigDecimal monthlyPayment;

    @Positive(message = "Interest rate must be positive")
    private BigDecimal interestRate;

    private LocalDate startDate;
}
