package com.financetracker.dto.creditcard;

import com.financetracker.entity.PaymentStatus;
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
public class CreditCardPaymentResponse {

    private UUID id;
    private Integer paymentNumber;
    private BigDecimal principalAmount;
    private BigDecimal feeAmount;
    private BigDecimal interestAmount;
    private BigDecimal totalAmount;
    private BigDecimal remainingAfter;
    private LocalDate dueDate;
    private LocalDate paymentDate;
    private PaymentStatus status;
}
