package com.financetracker.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "token_usages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TokenUsage extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "input_tokens", nullable = false)
    @Builder.Default
    private Integer inputTokens = 0;

    @Column(name = "output_tokens", nullable = false)
    @Builder.Default
    private Integer outputTokens = 0;

    @Column(name = "total_tokens", nullable = false)
    @Builder.Default
    private Integer totalTokens = 0;

    @Column(name = "model", length = 50)
    private String model;

    @Column(name = "feature", length = 50)
    private String feature; // e.g., "chat", "analysis", etc.

    @Column(name = "session_id", length = 100)
    private String sessionId;
}
