package com.financetracker.controller;

import com.financetracker.dto.chat.*;
import com.financetracker.security.CustomUserDetails;
import com.financetracker.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Tag(name = "Chat", description = "AI Chatbot endpoints")
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/message")
    @Operation(summary = "Send a message to AI chatbot")
    public ResponseEntity<ChatResponse> sendMessage(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ChatRequest request) {
        return ResponseEntity.ok(chatService.sendMessage(userDetails.getId(), request));
    }

    @GetMapping("/history")
    @Operation(summary = "Get chat history")
    public ResponseEntity<ChatHistoryResponse> getHistory(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(chatService.getHistory(userDetails.getId()));
    }

    @DeleteMapping("/history")
    @Operation(summary = "Clear chat history")
    public ResponseEntity<Void> clearHistory(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        chatService.clearHistory(userDetails.getId());
        return ResponseEntity.noContent().build();
    }
}
