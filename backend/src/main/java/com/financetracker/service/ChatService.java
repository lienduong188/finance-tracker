package com.financetracker.service;

import com.financetracker.dto.chat.*;
import com.financetracker.entity.*;
import com.financetracker.exception.ApiException;
import com.financetracker.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final RestTemplate restTemplate;

    @Value("${groq.api-key:}")
    private String groqApiKey;

    @Value("${groq.api-url:https://api.groq.com/openai/v1/chat/completions}")
    private String groqApiUrl;

    @Value("${groq.model:llama-3.3-70b-versatile}")
    private String groqModel;

    private static final int MAX_CONTEXT_MESSAGES = 10;

    @Transactional
    public ChatResponse sendMessage(UUID userId, ChatRequest request) {
        if (groqApiKey == null || groqApiKey.isBlank()) {
            throw ApiException.badRequest("Groq API key is not configured");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User"));

        // 1. Save user message
        ChatMessage userMessage = ChatMessage.builder()
                .user(user)
                .role(ChatRole.USER)
                .content(request.getMessage())
                .build();
        chatMessageRepository.save(userMessage);

        // 2. Build financial context
        String financialContext = buildFinancialContext(userId, user.getDefaultCurrency());

        // 3. Get recent conversation history
        List<ChatMessage> recentMessages = chatMessageRepository.findRecentByUserId(
                userId, PageRequest.of(0, MAX_CONTEXT_MESSAGES));
        Collections.reverse(recentMessages);

        // 4. Call Groq API
        String language = request.getLanguage() != null ? request.getLanguage() : "vi";
        String aiResponse = callGroqApi(financialContext, recentMessages, request.getMessage(), language);

        // 5. Save assistant response
        ChatMessage assistantMessage = ChatMessage.builder()
                .user(user)
                .role(ChatRole.ASSISTANT)
                .content(aiResponse)
                .build();
        assistantMessage = chatMessageRepository.save(assistantMessage);

        return toResponse(assistantMessage);
    }

    public ChatHistoryResponse getHistory(UUID userId) {
        List<ChatMessage> messages = chatMessageRepository.findAllByUserIdOrderByCreatedAtAsc(userId);
        return ChatHistoryResponse.builder()
                .messages(messages.stream().map(this::toResponse).collect(Collectors.toList()))
                .totalCount(messages.size())
                .build();
    }

    @Transactional
    public void clearHistory(UUID userId) {
        chatMessageRepository.deleteAllByUserId(userId);
    }

    private String buildFinancialContext(UUID userId, String currency) {
        LocalDate today = LocalDate.now();
        LocalDate startOfMonth = today.withDayOfMonth(1);
        LocalDate endOfMonth = today.withDayOfMonth(today.lengthOfMonth());

        // Get accounts summary
        List<Account> accounts = accountRepository.findByUserIdAndIsActiveTrue(userId);
        BigDecimal totalBalance = accounts.stream()
                .map(Account::getCurrentBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Get monthly transactions summary
        List<Object[]> sumByType = transactionRepository.sumByTypeAndDateRange(userId, startOfMonth, endOfMonth);
        BigDecimal monthlyIncome = BigDecimal.ZERO;
        BigDecimal monthlyExpense = BigDecimal.ZERO;
        for (Object[] row : sumByType) {
            TransactionType type = (TransactionType) row[0];
            BigDecimal sum = (BigDecimal) row[1];
            if (type == TransactionType.INCOME) monthlyIncome = sum;
            else if (type == TransactionType.EXPENSE) monthlyExpense = sum;
        }

        // Get top spending categories this month
        List<Object[]> categorySpending = transactionRepository.sumByCategoryAndDateRange(
                userId, TransactionType.EXPENSE, startOfMonth, endOfMonth);

        StringBuilder context = new StringBuilder();
        context.append("=== THONG TIN TAI CHINH CUA NGUOI DUNG ===\n\n");
        context.append(String.format("Tien te mac dinh: %s\n", currency));
        context.append(String.format("Ngay hom nay: %s\n\n", today));

        // Accounts
        context.append("--- TAI KHOAN ---\n");
        context.append(String.format("Tong so du: %s %s\n", totalBalance, currency));
        for (Account acc : accounts) {
            context.append(String.format("- %s (%s): %s %s\n",
                    acc.getName(), acc.getType(), acc.getCurrentBalance(), acc.getCurrency()));
        }

        // Monthly summary
        context.append("\n--- THONG KE THANG NAY ---\n");
        context.append(String.format("Thu nhap: %s %s\n", monthlyIncome, currency));
        context.append(String.format("Chi tieu: %s %s\n", monthlyExpense, currency));
        context.append(String.format("Tiet kiem: %s %s\n", monthlyIncome.subtract(monthlyExpense), currency));

        // Top categories
        if (!categorySpending.isEmpty()) {
            context.append("\n--- TOP DANH MUC CHI TIEU THANG NAY ---\n");
            int count = 0;
            for (Object[] row : categorySpending) {
                if (count >= 5) break;
                String catName = (String) row[1];
                BigDecimal amount = (BigDecimal) row[2];
                context.append(String.format("%d. %s: %s %s\n", ++count,
                        catName != null ? catName : "Khong phan loai", amount, currency));
            }
        }

        // Budget alerts
        List<Budget> budgets = budgetRepository.findByUserIdAndIsActiveTrue(userId);
        List<Budget> overBudget = budgets.stream()
                .filter(b -> b.getSpentAmount() != null && b.getAmount() != null &&
                        b.getSpentAmount().compareTo(b.getAmount()) > 0)
                .collect(Collectors.toList());
        if (!overBudget.isEmpty()) {
            context.append("\n--- NGAN SACH VUOT HAN MUC ---\n");
            for (Budget b : overBudget) {
                context.append(String.format("- %s: Chi %s/%s %s\n",
                        b.getName(), b.getSpentAmount(), b.getAmount(), b.getCurrency()));
            }
        }

        return context.toString();
    }

    @SuppressWarnings("unchecked")
    private String callGroqApi(String financialContext, List<ChatMessage> history, String userMessage, String language) {
        String systemPrompt = buildSystemPrompt(language) + financialContext;

        // Build messages array for OpenAI-compatible API
        List<Map<String, String>> messages = new ArrayList<>();

        // Add system message
        messages.add(Map.of("role", "system", "content", systemPrompt));

        // Add conversation history (skip the just-saved user message since we add it separately)
        for (int i = 0; i < history.size() - 1; i++) {
            ChatMessage msg = history.get(i);
            messages.add(Map.of(
                    "role", msg.getRole() == ChatRole.USER ? "user" : "assistant",
                    "content", msg.getContent()
            ));
        }

        // Add current user message
        messages.add(Map.of("role", "user", "content", userMessage));

        // Build request body
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", groqModel);
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.7);
        requestBody.put("max_tokens", 1024);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        try {
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(groqApiUrl, entity, Map.class);

            if (response.getBody() != null) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    if (message != null) {
                        return (String) message.get("content");
                    }
                }
            }
            return getErrorMessage(language, false);
        } catch (HttpClientErrorException.TooManyRequests e) {
            log.warn("Groq API rate limit exceeded (429)");
            return getMaintenanceMessage(language);
        } catch (Exception e) {
            log.error("Error calling Groq API", e);
            if (e.getMessage() != null && e.getMessage().contains("429")) {
                return getMaintenanceMessage(language);
            }
            return getErrorMessage(language, true);
        }
    }

    private String buildSystemPrompt(String language) {
        // language parameter is kept for error messages, but AI will auto-detect user's language
        return """
            You are a smart financial assistant for a personal expense management app.

            CRITICAL LANGUAGE RULE:
            - ALWAYS detect the language of the user's question
            - ALWAYS respond in the SAME language as the user's question
            - If user asks in Vietnamese, respond in Vietnamese
            - If user asks in Japanese, respond in Japanese
            - If user asks in English, respond in English

            TASKS:
            - Answer questions about the user's finances based on real data
            - Provide appropriate financial advice
            - Explain clearly and understandably

            RULES:
            - Only use provided data, DO NOT assume figures
            - If there is no data, inform the user
            - Answer concisely, directly to the point
            - You can use emojis for more engaging responses

            CURRENT FINANCIAL DATA:
            """;
    }

    private String getMaintenanceMessage(String language) {
        return switch (language) {
            case "en" -> "🔧 AI Assistant is currently under maintenance. We'll be back soon! Thank you for your patience.";
            case "ja" -> "🔧 AIアシスタントは現在メンテナンス中です。まもなく復旧いたします。ご理解のほどよろしくお願いいたします。";
            default -> "🔧 Trợ lý AI đang được bảo trì. Chúng tôi sẽ sớm hoạt động trở lại! Cảm ơn bạn đã kiên nhẫn.";
        };
    }

    private String getErrorMessage(String language, boolean isConnectionError) {
        if (isConnectionError) {
            return switch (language) {
                case "en" -> "An error occurred while connecting to AI. Please try again later.";
                case "ja" -> "AIへの接続中にエラーが発生しました。後でもう一度お試しください。";
                default -> "Co loi xay ra khi ket noi voi AI. Vui long thu lai sau.";
            };
        }
        return switch (language) {
            case "en" -> "Sorry, I cannot process your request right now. Please try again later.";
            case "ja" -> "申し訳ありませんが、現在リクエストを処理できません。後でもう一度お試しください。";
            default -> "Xin loi, toi khong the xu ly yeu cau cua ban luc nay. Vui long thu lai sau.";
        };
    }

    private ChatResponse toResponse(ChatMessage message) {
        return ChatResponse.builder()
                .id(message.getId())
                .role(message.getRole().name())
                .content(message.getContent())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
