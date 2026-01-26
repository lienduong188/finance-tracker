package com.financetracker.dto.chat;

import lombok.*;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ChatHistoryResponse {
    private List<ChatResponse> messages;
    private int totalCount;
}
