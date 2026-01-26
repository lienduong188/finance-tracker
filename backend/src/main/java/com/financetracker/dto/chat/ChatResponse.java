package com.financetracker.dto.chat;

import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ChatResponse {
    private UUID id;
    private String role;
    private String content;
    private OffsetDateTime createdAt;
}
