package com.financetracker.repository;

import com.financetracker.entity.ExchangeRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExchangeRateRepository extends JpaRepository<ExchangeRate, UUID> {

    Optional<ExchangeRate> findByFromCurrencyAndToCurrencyAndDate(
            String fromCurrency, String toCurrency, LocalDate date);

    @Query("SELECT e FROM ExchangeRate e WHERE e.fromCurrency = :from AND e.toCurrency = :to " +
           "ORDER BY e.date DESC LIMIT 1")
    Optional<ExchangeRate> findLatestRate(@Param("from") String fromCurrency, @Param("to") String toCurrency);

    @Query("SELECT e FROM ExchangeRate e WHERE e.date = (SELECT MAX(e2.date) FROM ExchangeRate e2)")
    List<ExchangeRate> findAllLatestRates();

    @Query("SELECT e FROM ExchangeRate e WHERE e.fromCurrency = :from AND e.date = :date")
    List<ExchangeRate> findByFromCurrencyAndDate(@Param("from") String fromCurrency, @Param("date") LocalDate date);

    @Query("SELECT DISTINCT e.fromCurrency FROM ExchangeRate e")
    List<String> findDistinctFromCurrencies();

    @Query("SELECT DISTINCT e.toCurrency FROM ExchangeRate e")
    List<String> findDistinctToCurrencies();
}
