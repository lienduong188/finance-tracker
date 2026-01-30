package com.financetracker.repository;

import com.financetracker.entity.TokenUsage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface TokenUsageRepository extends JpaRepository<TokenUsage, UUID> {

    List<TokenUsage> findByUserId(UUID userId);

    Page<TokenUsage> findByUserId(UUID userId, Pageable pageable);

    @Query("SELECT SUM(t.totalTokens) FROM TokenUsage t WHERE t.user.id = :userId")
    Long sumTotalTokensByUserId(@Param("userId") UUID userId);

    @Query("SELECT SUM(t.totalTokens) FROM TokenUsage t WHERE t.user.id = :userId AND t.createdAt >= :since")
    Long sumTotalTokensByUserIdSince(@Param("userId") UUID userId, @Param("since") OffsetDateTime since);

    // Admin queries
    @Query("SELECT SUM(t.totalTokens) FROM TokenUsage t")
    Long sumAllTotalTokens();

    @Query("SELECT SUM(t.totalTokens) FROM TokenUsage t WHERE t.createdAt >= :since")
    Long sumAllTotalTokensSince(@Param("since") OffsetDateTime since);

    @Query("SELECT SUM(t.inputTokens) FROM TokenUsage t")
    Long sumAllInputTokens();

    @Query("SELECT SUM(t.outputTokens) FROM TokenUsage t")
    Long sumAllOutputTokens();

    @Query("SELECT COUNT(DISTINCT t.user.id) FROM TokenUsage t")
    Long countDistinctUsers();

    @Query("SELECT COUNT(DISTINCT t.user.id) FROM TokenUsage t WHERE t.createdAt >= :since")
    Long countDistinctUsersSince(@Param("since") OffsetDateTime since);

    // Top users by token usage
    @Query("SELECT t.user.id, t.user.email, t.user.fullName, SUM(t.totalTokens) as total " +
           "FROM TokenUsage t GROUP BY t.user.id, t.user.email, t.user.fullName " +
           "ORDER BY total DESC")
    List<Object[]> findTopUsersByTokenUsage(Pageable pageable);

    // Usage by date
    @Query("SELECT CAST(t.createdAt AS date), SUM(t.totalTokens) " +
           "FROM TokenUsage t WHERE t.createdAt >= :since " +
           "GROUP BY CAST(t.createdAt AS date) ORDER BY CAST(t.createdAt AS date)")
    List<Object[]> findDailyUsageSince(@Param("since") OffsetDateTime since);

    // Usage by model
    @Query("SELECT t.model, SUM(t.totalTokens), COUNT(t) " +
           "FROM TokenUsage t GROUP BY t.model")
    List<Object[]> findUsageByModel();

    long countByCreatedAtAfter(OffsetDateTime date);

    void deleteByUserId(UUID userId);
}
