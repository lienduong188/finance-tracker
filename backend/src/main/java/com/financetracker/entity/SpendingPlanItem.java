package com.financetracker.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "spending_plan_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpendingPlanItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private SpendingPlan plan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "estimated_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal estimatedAmount;

    @Column(name = "actual_amount", nullable = false, precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal actualAmount = BigDecimal.ZERO;

    @Column(length = 50)
    private String icon;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("expenseDate DESC")
    @Builder.Default
    private List<SpendingPlanExpense> expenses = new ArrayList<>();

    public double getProgressPercentage() {
        if (estimatedAmount.compareTo(BigDecimal.ZERO) == 0) {
            return 0;
        }
        return actualAmount.divide(estimatedAmount, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
    }

    public BigDecimal getRemainingAmount() {
        return estimatedAmount.subtract(actualAmount);
    }

    public boolean isOverBudget() {
        return actualAmount.compareTo(estimatedAmount) > 0;
    }

    public void recalculateActual() {
        this.actualAmount = expenses.stream()
                .map(SpendingPlanExpense::getAmountInPlanCurrency)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
