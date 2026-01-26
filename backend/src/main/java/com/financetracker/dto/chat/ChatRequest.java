package com.financetracker.dto.chat;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ChatRequest {
    @NotBlank(message = "Message is required")
    private String message;

    private String language; // vi, en, ja
}
