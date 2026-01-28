package com.financetracker.repository;

import com.financetracker.entity.Account;
import com.financetracker.entity.AccountPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountPermissionRepository extends JpaRepository<AccountPermission, UUID> {

    List<AccountPermission> findByAccountId(UUID accountId);

    Optional<AccountPermission> findByAccountIdAndUserId(UUID accountId, UUID userId);

    void deleteByAccountIdAndUserId(UUID accountId, UUID userId);

    void deleteByAccountId(UUID accountId);

    @Query("SELECT ap.account FROM AccountPermission ap WHERE ap.user.id = :userId AND ap.canView = true")
    List<Account> findViewableAccountsByUserId(@Param("userId") UUID userId);

    @Query("SELECT ap.account FROM AccountPermission ap WHERE ap.user.id = :userId AND ap.canTransact = true")
    List<Account> findTransactableAccountsByUserId(@Param("userId") UUID userId);

    boolean existsByAccountIdAndUserIdAndCanViewTrue(UUID accountId, UUID userId);

    boolean existsByAccountIdAndUserIdAndCanTransactTrue(UUID accountId, UUID userId);
}
