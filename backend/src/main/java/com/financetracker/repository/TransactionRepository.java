package com.financetracker.repository;

import com.financetracker.entity.Transaction;
import com.financetracker.entity.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID>, JpaSpecificationExecutor<Transaction> {

    List<Transaction> findByUserId(UUID userId);

    Page<Transaction> findByUserId(UUID userId, Pageable pageable);

    Page<Transaction> findByUserIdAndType(UUID userId, TransactionType type, Pageable pageable);

    Page<Transaction> findByUserIdAndAccountId(UUID userId, UUID accountId, Pageable pageable);

    Page<Transaction> findByUserIdAndCategoryId(UUID userId, UUID categoryId, Pageable pageable);

    @Query("SELECT t FROM Transaction t WHERE t.user.id = :userId " +
           "AND t.transactionDate BETWEEN :startDate AND :endDate " +
           "ORDER BY t.transactionDate DESC")
    List<Transaction> findByUserIdAndDateRange(
            @Param("userId") UUID userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    Optional<Transaction> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT t.type, SUM(t.amount) FROM Transaction t " +
           "WHERE t.user.id = :userId AND t.transactionDate BETWEEN :startDate AND :endDate " +
           "GROUP BY t.type")
    List<Object[]> sumByTypeAndDateRange(
            @Param("userId") UUID userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT t.category.id, t.category.name, SUM(t.amount) FROM Transaction t " +
           "WHERE t.user.id = :userId AND t.type = :type " +
           "AND t.transactionDate BETWEEN :startDate AND :endDate " +
           "GROUP BY t.category.id, t.category.name")
    List<Object[]> sumByCategoryAndDateRange(
            @Param("userId") UUID userId,
            @Param("type") TransactionType type,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT SUM(t.amount) FROM Transaction t " +
           "WHERE t.user.id = :userId AND t.category.id = :categoryId " +
           "AND t.transactionDate BETWEEN :startDate AND :endDate")
    BigDecimal sumByCategoryIdAndDateRange(
            @Param("userId") UUID userId,
            @Param("categoryId") UUID categoryId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    long countByCreatedAtAfter(OffsetDateTime date);

    // Family transactions
    List<Transaction> findByFamilyId(UUID familyId);

    Page<Transaction> findByFamilyId(UUID familyId, Pageable pageable);

    @Query("SELECT t FROM Transaction t WHERE t.family.id = :familyId " +
           "AND t.transactionDate BETWEEN :startDate AND :endDate " +
           "ORDER BY t.transactionDate DESC")
    List<Transaction> findByFamilyIdAndDateRange(
            @Param("familyId") UUID familyId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    Optional<Transaction> findByIdAndFamilyId(UUID id, UUID familyId);

    // Find all accessible transactions (user's personal + family transactions)
    @Query("SELECT t FROM Transaction t WHERE t.user.id = :userId OR t.family.id IN :familyIds ORDER BY t.transactionDate DESC")
    Page<Transaction> findAccessibleTransactions(@Param("userId") UUID userId, @Param("familyIds") List<UUID> familyIds, Pageable pageable);

    @Query("SELECT t.type, SUM(t.amount) FROM Transaction t " +
           "WHERE t.family.id = :familyId AND t.transactionDate BETWEEN :startDate AND :endDate " +
           "GROUP BY t.type")
    List<Object[]> sumByTypeAndDateRangeForFamily(
            @Param("familyId") UUID familyId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT t.category.id, t.category.name, SUM(t.amount) FROM Transaction t " +
           "WHERE t.family.id = :familyId AND t.type = :type " +
           "AND t.transactionDate BETWEEN :startDate AND :endDate " +
           "GROUP BY t.category.id, t.category.name")
    List<Object[]> sumByCategoryAndDateRangeForFamily(
            @Param("familyId") UUID familyId,
            @Param("type") TransactionType type,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
