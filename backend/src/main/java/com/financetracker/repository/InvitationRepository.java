package com.financetracker.repository;

import com.financetracker.entity.Invitation;
import com.financetracker.entity.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, UUID> {

    Optional<Invitation> findByToken(String token);

    List<Invitation> findByFamilyIdAndStatus(UUID familyId, InvitationStatus status);

    List<Invitation> findByFamilyId(UUID familyId);

    List<Invitation> findByInviteeEmailAndStatus(String email, InvitationStatus status);

    @Query("SELECT i FROM Invitation i WHERE i.invitee.id = :userId AND i.status = :status")
    List<Invitation> findByInviteeIdAndStatus(@Param("userId") UUID userId, @Param("status") InvitationStatus status);

    @Query("SELECT i FROM Invitation i WHERE (i.inviteeEmail = :email OR i.invitee.id = :userId) AND i.status = 'PENDING'")
    List<Invitation> findPendingByEmailOrUserId(@Param("email") String email, @Param("userId") UUID userId);

    boolean existsByFamilyIdAndInviteeEmailAndStatus(UUID familyId, String email, InvitationStatus status);

    @Modifying
    @Query("UPDATE Invitation i SET i.status = 'EXPIRED', i.updatedAt = CURRENT_TIMESTAMP WHERE i.expiresAt < :now AND i.status = 'PENDING'")
    int expireOldInvitations(@Param("now") OffsetDateTime now);

    long countByInviteeEmailAndStatus(String email, InvitationStatus status);

    @Query("SELECT COUNT(i) FROM Invitation i WHERE (i.inviteeEmail = :email OR i.invitee.id = :userId) AND i.status = 'PENDING'")
    long countPendingByEmailOrUserId(@Param("email") String email, @Param("userId") UUID userId);
}
