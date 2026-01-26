package com.financetracker.dto.debt;

import com.financetracker.entity.DebtStatus;
import com.financetracker.entity.DebtType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DebtResponse {

    private UUID id;
    private DebtType type;
    private String personName;
    private BigDecimal amount;
    private String currency;
    private String description;
    private LocalDate startDate;
    private LocalDate dueDate;
    private DebtStatus status;
    private BigDecimal paidAmount;
    private BigDecimal remainingAmount;
    private String note;
    private boolean overdue;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
