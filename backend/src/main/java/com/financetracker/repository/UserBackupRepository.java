package com.financetracker.repository;

import com.financetracker.entity.UserBackup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserBackupRepository extends JpaRepository<UserBackup, UUID> {

    List<UserBackup> findByUserIdOrderByCreatedAtDesc(UUID userId);

    long countByUserId(UUID userId);

    @Query(value = """
            DELETE FROM user_backups
            WHERE user_id = :userId
              AND id NOT IN (
                SELECT id FROM user_backups
                WHERE user_id = :userId
                ORDER BY created_at DESC
                LIMIT :keepCount
              )
            """, nativeQuery = true)
    @Modifying
    void deleteOldBackups(@Param("userId") UUID userId, @Param("keepCount") int keepCount);

    @Query("SELECT b FROM UserBackup b WHERE b.id = :id AND b.user.id = :userId")
    java.util.Optional<UserBackup> findByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);
}
