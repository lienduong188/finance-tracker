package com.financetracker.repository;

import com.financetracker.entity.Transaction;
import com.financetracker.entity.TransactionType;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.UUID;

public class TransactionSpecification {

    public static Specification<Transaction> withFilters(UUID userId, UUID accountId, String type,
            LocalDate startDate, LocalDate endDate) {
        return (root, query, cb) -> {
            var predicates = cb.conjunction();

            // Always filter by userId
            predicates = cb.and(predicates, cb.equal(root.get("user").get("id"), userId));

            // Filter by accountId if provided
            if (accountId != null) {
                predicates = cb.and(predicates, cb.equal(root.get("account").get("id"), accountId));
            }

            // Filter by type if provided
            if (type != null && !type.isEmpty()) {
                predicates = cb.and(predicates, cb.equal(root.get("type"), TransactionType.valueOf(type)));
            }

            // Filter by startDate if provided
            if (startDate != null) {
                predicates = cb.and(predicates, cb.greaterThanOrEqualTo(root.get("transactionDate"), startDate));
            }

            // Filter by endDate if provided
            if (endDate != null) {
                predicates = cb.and(predicates, cb.lessThanOrEqualTo(root.get("transactionDate"), endDate));
            }

            // Add default ordering
            query.orderBy(cb.desc(root.get("transactionDate")));

            return predicates;
        };
    }
}
