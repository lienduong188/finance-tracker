package com.financetracker.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "account_permissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountPermission extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "can_view", nullable = false)
    @Builder.Default
    private Boolean canView = true;

    @Column(name = "can_transact", nullable = false)
    @Builder.Default
    private Boolean canTransact = false;
}
