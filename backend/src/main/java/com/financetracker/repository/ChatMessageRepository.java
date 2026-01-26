package com.financetracker.repository;

import com.financetracker.entity.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    @Query("SELECT m FROM ChatMessage m WHERE m.user.id = :userId ORDER BY m.createdAt DESC")
    List<ChatMessage> findRecentByUserId(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT m FROM ChatMessage m WHERE m.user.id = :userId ORDER BY m.createdAt ASC")
    List<ChatMessage> findAllByUserIdOrderByCreatedAtAsc(@Param("userId") UUID userId);

    @Modifying
    @Query("DELETE FROM ChatMessage m WHERE m.user.id = :userId")
    void deleteAllByUserId(@Param("userId") UUID userId);
}
