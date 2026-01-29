package com.financetracker.dto.savings;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SavingsContributionUpdateRequest {
    private String note;
    private LocalDate contributionDate;
}
