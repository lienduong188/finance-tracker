package com.financetracker.repository;

import com.financetracker.entity.Role;
import com.financetracker.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    // Admin methods
    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<User> searchUsers(@Param("keyword") String keyword, Pageable pageable);

    List<User> findByRole(Role role);

    long countByRole(Role role);

    long countByEnabled(Boolean enabled);

    long countByCreatedAtAfter(OffsetDateTime date);

    // Find users with pending deletion that should be processed
    List<User> findByDeletionScheduledAtBeforeAndDeletionScheduledAtIsNotNull(OffsetDateTime date);
}
