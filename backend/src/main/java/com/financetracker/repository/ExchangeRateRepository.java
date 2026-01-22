package com.financetracker.repository;

import com.financetracker.entity.ExchangeRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExchangeRateRepository extends JpaRepository<ExchangeRate, UUID> {

    Optional<ExchangeRate> findByFromCurrencyAndToCurrencyAndDate(
            String fromCurrency, String toCurrency, LocalDate date);

    @Query("SELECT e FROM ExchangeRate e WHERE e.fromCurrency = :from AND e.toCurrency = :to " +
           "ORDER BY e.date DESC LIMIT 1")
    Optional<ExchangeRate> findLatestRate(@Param("from") String fromCurrency, @Param("to") String toCurrency);
}
