package com.financetracker.repository;

import com.financetracker.entity.Account;
import com.financetracker.entity.AccountType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountRepository extends JpaRepository<Account, UUID> {

    List<Account> findByUserIdAndIsActiveTrue(UUID userId);

    List<Account> findByUserId(UUID userId);

    List<Account> findByUserIdAndType(UUID userId, AccountType type);

    Optional<Account> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT SUM(a.currentBalance) FROM Account a WHERE a.user.id = :userId AND a.isActive = true AND a.currency = :currency")
    BigDecimal sumBalanceByUserIdAndCurrency(@Param("userId") UUID userId, @Param("currency") String currency);

    @Query("SELECT a.currency, SUM(a.currentBalance) FROM Account a WHERE a.user.id = :userId AND a.isActive = true GROUP BY a.currency")
    List<Object[]> sumBalanceByUserIdGroupByCurrency(@Param("userId") UUID userId);

    @Query("SELECT a FROM Account a WHERE a.type = 'CREDIT_CARD' AND a.isActive = true AND a.billingDay = :day AND a.linkedAccount IS NOT NULL")
    List<Account> findCreditCardsDueForPayment(@Param("day") int day);

    @Query("SELECT a FROM Account a WHERE a.isActive = true AND a.currentBalance <= :threshold")
    List<Account> findByCurrentBalanceLessThanEqual(@Param("threshold") BigDecimal threshold);

    List<Account> findByCurrencyAndIsActiveTrue(String currency);

    default List<Account> findByCurrency(String currency) {
        return findByCurrencyAndIsActiveTrue(currency);
    }

    void deleteByUserId(UUID userId);
}
