package com.financetracker.repository;

import com.financetracker.entity.Notification;
import com.financetracker.entity.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Page<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(UUID userId);

    long countByUserIdAndIsReadFalse(UUID userId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user.id = :userId AND n.isRead = false")
    int markAllAsRead(@Param("userId") UUID userId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.id = :id AND n.user.id = :userId")
    int markAsRead(@Param("id") UUID id, @Param("userId") UUID userId);

    // Check if notification already exists (to avoid duplicates)
    boolean existsByUserIdAndTypeAndCreatedAtAfter(UUID userId, NotificationType type, OffsetDateTime after);

    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId AND n.type = :type AND n.createdAt > :after")
    List<Notification> findRecentByUserAndType(@Param("userId") UUID userId, @Param("type") NotificationType type, @Param("after") OffsetDateTime after);

    // Delete old read notifications (cleanup)
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.isRead = true AND n.createdAt < :before")
    int deleteOldReadNotifications(@Param("before") OffsetDateTime before);

    void deleteByUserId(UUID userId);
}
