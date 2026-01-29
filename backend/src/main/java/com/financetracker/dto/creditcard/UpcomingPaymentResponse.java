package com.financetracker.dto.creditcard;

import com.financetracker.entity.PaymentStatus;
import com.financetracker.entity.PaymentType;
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
public class UpcomingPaymentResponse {

    private UUID paymentId;
    private UUID planId;
    private PaymentType paymentType;
    private String accountName;
    private String transactionDescription;
    private Integer paymentNumber;
    private Integer totalInstallments;
    private BigDecimal totalAmount;
    private String currency;
    private LocalDate dueDate;
    private PaymentStatus status;
}
