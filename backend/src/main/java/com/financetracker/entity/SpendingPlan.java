package com.financetracker.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "spending_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpendingPlan extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_id")
    private Family family;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 3, nullable = false)
    @Builder.Default
    private String currency = "VND";

    @Column(length = 50)
    private String icon;

    @Column(length = 7)
    private String color;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private SpendingPlanStatus status = SpendingPlanStatus.PLANNING;

    @Column(name = "total_estimated", nullable = false, precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal totalEstimated = BigDecimal.ZERO;

    @Column(name = "total_actual", nullable = false, precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal totalActual = BigDecimal.ZERO;

    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<SpendingPlanItem> items = new ArrayList<>();

    public double getProgressPercentage() {
        if (totalEstimated.compareTo(BigDecimal.ZERO) == 0) {
            return 0;
        }
        return totalActual.divide(totalEstimated, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
    }

    public BigDecimal getRemainingAmount() {
        return totalEstimated.subtract(totalActual);
    }

    public void recalculateTotals() {
        this.totalEstimated = items.stream()
                .map(SpendingPlanItem::getEstimatedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        this.totalActual = items.stream()
                .map(SpendingPlanItem::getActualAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
